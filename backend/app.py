from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import numpy as np
import cv2
import base64
import os
import json
from stress_detection import StressDetectionAPI
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Secret key for JWT authentication
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'development_secret_key')

# Initialize the stress detection API
api = StressDetectionAPI()

# Upload directory
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Authentication middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in the request headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            token_parts = auth_header.split(' ')
            if len(token_parts) == 2 and token_parts[0].lower() == 'bearer':
                token = token_parts[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing!'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'success': False, 'message': 'Token is invalid!'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Admin access middleware
def admin_required(f):
    @wraps(f)
    def decorated(current_user_id, *args, **kwargs):
        # Get user from database
        user = api.db.get_user_by_id(current_user_id)
        
        if not user or user['role'] != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required!'}), 403
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# User routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Please provide all required fields!'}), 400
    
    # Hash the password
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Add user to database
    success, message = api.db.add_user(
        data['name'],
        data['email'],
        hashed_password,
        data.get('role', 'user')
    )
    
    return jsonify({'success': success, 'message': message})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Please provide email and password!'}), 400
    
    # Get user from database (using a custom query since we need the password)
    cursor = api.db.connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
    user = cursor.fetchone()
    cursor.close()
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'success': False, 'message': 'Invalid email or password!'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.utcnow() + timedelta(days=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    # Remove password from user data
    user.pop('password', None)
    
    return jsonify({
        'success': True,
        'token': token,
        'user': user
    })

@app.route('/api/users/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    user = api.db.get_user_by_id(current_user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found!'}), 404
    
    # Remove password from user data
    if 'password' in user:
        user.pop('password', None)
    
    return jsonify({
        'success': True,
        'user': user
    })

# Stress detection routes
@app.route('/api/stress/analyze', methods=['POST'])
@token_required
def analyze_image(current_user_id):
    # Check if user is approved
    user = api.db.get_user_by_id(current_user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found!'}), 404
    
    if not user['is_approved']:
        return jsonify({'success': False, 'message': 'User account not approved!'}), 403
    
    # Process the image
    if 'image' in request.files:
        # Process uploaded file
        image_file = request.files['image']
        filename = f"{current_user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image_file.save(image_path)
    
    elif 'image_data' in request.form:
        # Process base64 image data (from webcam)
        try:
            image_data = request.form['image_data']
            # Remove the prefix if present (e.g., 'data:image/jpeg;base64,')
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Save the image
            filename = f"{current_user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg"
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            cv2.imwrite(image_path, image)
        
        except Exception as e:
            return jsonify({'success': False, 'message': f'Error processing image data: {str(e)}'}), 400
    
    else:
        return jsonify({'success': False, 'message': 'No image provided!'}), 400
    
    # Process the image with the stress detection model
    result = api.process_image(image_path, current_user_id)
    
    return jsonify(result)

@app.route('/api/stress/results', methods=['GET'])
@token_required
def get_stress_results(current_user_id):
    limit = request.args.get('limit', 10, type=int)
    results = api.get_user_results(current_user_id, limit)
    
    return jsonify({
        'success': True,
        'results': results
    })

# Admin routes
@app.route('/api/admin/users/pending', methods=['GET'])
@token_required
@admin_required
def get_pending_users(current_user_id):
    users = api.get_pending_users()
    
    return jsonify({
        'success': True,
        'users': users
    })

@app.route('/api/admin/users/approve', methods=['POST'])
@token_required
@admin_required
def approve_user(current_user_id):
    data = request.get_json()
    
    if not data or not data.get('user_id'):
        return jsonify({'success': False, 'message': 'User ID is required!'}), 400
    
    success, message = api.approve_user(data['user_id'])
    
    return jsonify({
        'success': success,
        'message': message
    })

@app.route('/api/admin/users/high-stress', methods=['GET'])
@token_required
@admin_required
def get_high_stress_users(current_user_id):
    users = api.get_high_stress_users()
    
    return jsonify({
        'success': True,
        'users': users
    })

@app.route('/api/admin/analytics', methods=['GET'])
@token_required
@admin_required
def get_analytics(current_user_id):
    """Get analytics data for admin dashboard"""
    stats = api.get_analytics_stats()
    department_data = api.get_department_stress_data()
    employee_data = api.get_employee_stress_data()
    
    return jsonify({
        'success': True,
        'stats': stats,
        'departmentData': department_data,
        'employeeData': employee_data
    })

# Cleanup function for when the application exits
def cleanup():
    api.close()

# Register cleanup function
import atexit
atexit.register(cleanup)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
