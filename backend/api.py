
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import json
import logging
from image_processor import StressDetector
from datetime import datetime
import jwt
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize app
app = Flask(__name__)
CORS(app)

# Secret key for JWT
SECRET_KEY = os.environ.get('SECRET_KEY', 'development_secret_key')

# Initialize stress detector
stress_detector = StressDetector()

# Upload directory
UPLOAD_DIR = 'uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

# JWT token verification decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            token_parts = auth_header.split(' ')
            if len(token_parts) == 2 and token_parts[0].lower() == 'bearer':
                token = token_parts[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Authentication token is missing'}), 401
        
        try:
            # Verify token
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user_id = data['user_id']
        except:
            return jsonify({'success': False, 'message': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        'success': True,
        'message': 'API is working correctly'
    })

@app.route('/api/detect/image', methods=['POST'])
@token_required
def detect_stress_image(current_user_id):
    """Detect stress from uploaded image"""
    logger.info(f"Processing stress detection request for user {current_user_id}")
    
    try:
        # Process image data
        if 'image' in request.files:
            # Save uploaded file
            image_file = request.files['image']
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{current_user_id}_{timestamp}.jpg"
            filepath = os.path.join(UPLOAD_DIR, filename)
            image_file.save(filepath)
            
            # Process image
            result = stress_detector.process_image(filepath)
        
        elif 'image_data' in request.form:
            # Process base64 image data
            image_data = request.form['image_data']
            
            # Save base64 image for record keeping
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{current_user_id}_{timestamp}.jpg"
            filepath = os.path.join(UPLOAD_DIR, filename)
            
            # Extract the base64 part if it contains metadata
            if ',' in image_data:
                image_data_parts = image_data.split(',', 1)
                if len(image_data_parts) == 2:
                    image_data = image_data_parts[1]
            
            # Decode and save
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(image_data))
            
            # Process image
            result = stress_detector.process_image(image_data)
        
        else:
            return jsonify({
                'success': False,
                'message': 'No image data provided'
            }), 400
        
        # Add user ID and timestamp to result
        if result['success']:
            result['user_id'] = current_user_id
            result['timestamp'] = datetime.now().isoformat()
            
            # Save result to a file (in a real app, this would go to a database)
            result_file = f"{current_user_id}_{timestamp}_result.json"
            result_path = os.path.join(UPLOAD_DIR, result_file)
            
            # Remove the base64 image from the saved result to save space
            result_to_save = result.copy()
            result_to_save.pop('result_image', None)
            
            with open(result_path, 'w') as f:
                json.dump(result_to_save, f)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing image: {str(e)}'
        }), 500

@app.route('/api/detect/webcam', methods=['POST'])
@token_required
def detect_stress_webcam(current_user_id):
    """Detect stress from webcam image"""
    # This is essentially the same as the image endpoint but specifically for webcam data
    logger.info(f"Processing webcam stress detection for user {current_user_id}")
    
    try:
        if 'image_data' not in request.form:
            return jsonify({
                'success': False,
                'message': 'No webcam image data provided'
            }), 400
        
        image_data = request.form['image_data']
        
        # Process image
        result = stress_detector.process_image(image_data)
        
        # Add user ID and timestamp to result
        if result['success']:
            result['user_id'] = current_user_id
            result['timestamp'] = datetime.now().isoformat()
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error processing webcam image: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing webcam image: {str(e)}'
        }), 500

@app.route('/api/results/<user_id>', methods=['GET'])
@token_required
def get_user_results(current_user_id, user_id):
    """Get stress detection results for a user"""
    # In a real app, this would fetch from a database
    # For this example, we'll read from saved result files
    
    # Check if the requesting user is the same as the target user or is an admin
    # (In a real app, would check admin status in the database)
    if current_user_id != user_id:
        return jsonify({
            'success': False,
            'message': 'Unauthorized access to user results'
        }), 403
    
    try:
        results = []
        
        # Find all result files for the user
        for filename in os.listdir(UPLOAD_DIR):
            if filename.startswith(f"{user_id}_") and filename.endswith("_result.json"):
                filepath = os.path.join(UPLOAD_DIR, filename)
                
                with open(filepath, 'r') as f:
                    result_data = json.load(f)
                    results.append(result_data)
        
        # Sort by timestamp (newest first)
        results.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return jsonify({
            'success': True,
            'results': results
        })
    
    except Exception as e:
        logger.error(f"Error retrieving results: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving results: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
