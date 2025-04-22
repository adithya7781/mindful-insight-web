
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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Secret key for JWT authentication
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'development_secret_key')

# Email configuration
EMAIL_USER = os.environ.get('EMAIL_USER', '')  # Set your email address in environment variable
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')  # Set your email password in environment variable
EMAIL_SERVER = os.environ.get('EMAIL_SERVER', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))

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

# Email sending function
def send_email(to_email, subject, body_html):
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print("Email credentials not configured. Skipping email.")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body_html, 'html'))
        
        server = smtplib.SMTP(EMAIL_SERVER, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False

# User routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Please provide all required fields!'}), 400
    
    # Check if the email is for admin
    is_admin = data.get('email') == 'adivishal2004@gmail.com'
    role = 'admin' if is_admin else 'user'
    
    # Hash the password
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Add user to database
    success, message = api.db.add_user(
        data['name'],
        data['email'],
        hashed_password,
        role
    )
    
    # If admin, also mark as approved
    if success and is_admin:
        user = api.db.get_user_by_email(data['email'])
        if user:
            api.db.approve_user(user['id'])
    
    # If registration successful, send welcome email
    if success:
        email_subject = "Welcome to Workplace Wellness - Registration Successful"
        email_body = f"""
        <html>
        <body>
            <h2>Welcome to Workplace Wellness, {data['name']}!</h2>
            <p>Thank you for registering. Your account has been created successfully.</p>
            <p>{'Your admin account is ready to use.' if is_admin else 'Your account is pending approval from an administrator.'}</p>
            <p>Best regards,<br>The Workplace Wellness Team</p>
        </body>
        </html>
        """
        send_email(data['email'], email_subject, email_body)
    
    return jsonify({'success': success, 'message': message})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Please provide email and password!'}), 400
    
    # Get user from database
    cursor = api.db.connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
    user = cursor.fetchone()
    cursor.close()
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'success': False, 'message': 'Invalid email or password!'}), 401
    
    # Check if user is approved
    if user['role'] != 'admin' and not user['is_approved']:
        return jsonify({'success': False, 'message': 'Your account is pending approval!'}), 403
    
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

# ... keep existing code (get_profile, analyze_image, get_stress_results functions)

# Notification endpoint for high stress
@app.route('/api/stress/notify', methods=['POST'])
@token_required
def notify_high_stress(current_user_id):
    # This would be called when a high stress level is detected
    user = api.db.get_user_by_id(current_user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found!'}), 404
    
    # Send email notification for high stress
    email_subject = "Wellness Alert - High Stress Detected"
    email_body = f"""
    <html>
    <body>
        <h2>High Stress Alert</h2>
        <p>Dear {user['name']},</p>
        <p>Our system has detected a high level of stress in your recent analysis.</p>
        <p>We recommend taking a short break, practicing deep breathing, or consulting with our wellness resources.</p>
        <p>Your wellbeing is important to us.</p>
        <p>Best regards,<br>The Workplace Wellness Team</p>
    </body>
    </html>
    """
    
    email_sent = send_email(user['email'], email_subject, email_body)
    
    return jsonify({
        'success': True,
        'message': 'Notification sent' if email_sent else 'Notification queued',
        'email_sent': email_sent
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
    
    # If approval successful, send notification email
    if success:
        # Get user info
        user = api.db.get_user_by_id(data['user_id'])
        if user:
            email_subject = "Workplace Wellness - Account Approved"
            email_body = f"""
            <html>
            <body>
                <h2>Account Approved</h2>
                <p>Dear {user['name']},</p>
                <p>Your account has been approved by an administrator.</p>
                <p>You can now log in and access all features of the Workplace Wellness platform.</p>
                <p>Best regards,<br>The Workplace Wellness Team</p>
            </body>
            </html>
            """
            send_email(user['email'], email_subject, email_body)
    
    return jsonify({
        'success': success,
        'message': message
    })

# ... keep existing code (get_high_stress_users, get_analytics functions)

# Modify the stress_results endpoint to also send notification for high stress
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
    
    # Send notification for high stress
    if result.get('stress_level') == 'high':
        email_subject = "Wellness Alert - High Stress Detected"
        email_body = f"""
        <html>
        <body>
            <h2>High Stress Alert</h2>
            <p>Dear {user['name']},</p>
            <p>Our system has detected a high level of stress in your recent analysis.</p>
            <p>Your stress score: {result.get('stress_score')}%</p>
            <p>We recommend taking a short break, practicing deep breathing, or consulting with our wellness resources.</p>
            <p>Your wellbeing is important to us.</p>
            <p>Best regards,<br>The Workplace Wellness Team</p>
        </body>
        </html>
        """
        send_email(user['email'], email_subject, email_body)
    
    return jsonify(result)

# Cleanup function for when the application exits
def cleanup():
    api.close()

# Register cleanup function
import atexit
atexit.register(cleanup)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
