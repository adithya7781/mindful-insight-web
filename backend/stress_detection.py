
import cv2
import numpy as np
from keras.models import Sequential
from keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from keras.optimizers import Adam
import mysql.connector
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'stress_detection')
}

# Email configuration
EMAIL_CONFIG = {
    'smtp_server': os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
    'smtp_port': int(os.getenv('SMTP_PORT', 587)),
    'smtp_username': os.getenv('SMTP_USERNAME', ''),
    'smtp_password': os.getenv('SMTP_PASSWORD', ''),
    'from_email': os.getenv('FROM_EMAIL', 'no-reply@stressdetect.com')
}

# Threshold for severe stress
SEVERE_STRESS_THRESHOLD = 75

class StressDetectionModel:
    def __init__(self):
        self.model = self._build_model()
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def _build_model(self):
        """Build and compile the CNN model for stress detection"""
        model = Sequential([
            # First convolutional layer
            Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            MaxPooling2D(pool_size=(2, 2)),
            
            # Second convolutional layer
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            
            # Third convolutional layer
            Conv2D(128, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            
            # Flatten the output
            Flatten(),
            
            # Fully connected layers
            Dense(256, activation='relu'),
            Dropout(0.5),
            Dense(128, activation='relu'),
            Dropout(0.3),
            
            # Output layer - regression for stress level (0-100)
            Dense(1, activation='sigmoid')
        ])
        
        # Compile the model
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='mean_squared_error',
            metrics=['mae']
        )
        
        return model
    
    def train(self, X_train, y_train, epochs=50, batch_size=32, validation_split=0.2):
        """Train the model on the provided dataset"""
        # In a real implementation, this would load and preprocess a stress detection dataset
        # For this example, we'll assume X_train and y_train are already prepared
        
        history = self.model.fit(
            X_train,
            y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=1
        )
        
        return history
    
    def save_model(self, filepath):
        """Save the trained model to disk"""
        self.model.save(filepath)
    
    def load_model(self, filepath):
        """Load a pre-trained model from disk"""
        from keras.models import load_model
        self.model = load_model(filepath)
    
    def preprocess_image(self, image):
        """Preprocess an image for the model"""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        
        if len(faces) == 0:
            return None
        
        # Process the largest face
        max_area = 0
        max_face = None
        
        for (x, y, w, h) in faces:
            if w * h > max_area:
                max_area = w * h
                max_face = (x, y, w, h)
        
        x, y, w, h = max_face
        face_roi = gray[y:y+h, x:x+w]
        
        # Resize to 48x48 (model input size)
        face_roi = cv2.resize(face_roi, (48, 48))
        
        # Normalize pixel values
        face_roi = face_roi / 255.0
        
        # Reshape for model
        face_roi = np.expand_dims(face_roi, axis=-1)  # Add channel dimension
        face_roi = np.expand_dims(face_roi, axis=0)   # Add batch dimension
        
        return face_roi, (x, y, w, h)
    
    def predict_stress(self, image):
        """Predict stress level from an image"""
        processed_data = self.preprocess_image(image)
        
        if processed_data is None:
            return None, None
        
        face_roi, face_coords = processed_data
        
        # Make prediction
        prediction = self.model.predict(face_roi)[0][0]
        
        # Scale to 0-100
        stress_level = float(prediction * 100)
        
        # Categorize stress level
        if stress_level < 40:
            category = "low"
        elif stress_level < 70:
            category = "medium"
        else:
            category = "high"
        
        return stress_level, category, face_coords
    
    def analyze_video_frame(self, frame):
        """Analyze a single video frame for stress detection"""
        return self.predict_stress(frame)
    
    def draw_results(self, image, stress_level, category, face_coords):
        """Draw stress detection results on the image"""
        if face_coords is None:
            return image
        
        x, y, w, h = face_coords
        
        # Draw face rectangle
        if category == "low":
            color = (0, 255, 0)  # Green
        elif category == "medium":
            color = (0, 165, 255)  # Orange
        else:
            color = (0, 0, 255)  # Red
        
        cv2.rectangle(image, (x, y), (x+w, y+h), color, 2)
        
        # Draw stress level text
        text = f"Stress: {stress_level:.1f}% ({category})"
        cv2.putText(image, text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        
        return image


class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """Connect to the MySQL database"""
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            print("Connected to MySQL database")
        except mysql.connector.Error as err:
            print(f"Error connecting to MySQL database: {err}")
    
    def create_tables(self):
        """Create necessary database tables if they don't exist"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor()
        
        # Users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL,
            role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
            is_approved BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Stress results table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS stress_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            stress_level FLOAT NOT NULL,
            category ENUM('low', 'medium', 'high') NOT NULL,
            image_url VARCHAR(255),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        ''')
        
        self.connection.commit()
        cursor.close()
    
    def add_user(self, name, email, password, role='user'):
        """Add a new user to the database"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                cursor.close()
                return False, "User with this email already exists"
            
            # Insert new user
            cursor.execute(
                "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
                (name, email, password, role)
            )
            
            self.connection.commit()
            cursor.close()
            return True, "User created successfully"
        except mysql.connector.Error as err:
            return False, f"Database error: {err}"
    
    def approve_user(self, user_id):
        """Approve a user account"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor()
            
            cursor.execute("UPDATE users SET is_approved = TRUE WHERE id = %s", (user_id,))
            
            if cursor.rowcount == 0:
                cursor.close()
                return False, "User not found"
            
            self.connection.commit()
            cursor.close()
            return True, "User approved successfully"
        except mysql.connector.Error as err:
            return False, f"Database error: {err}"
    
    def save_stress_result(self, user_id, stress_level, category, image_url=None, notes=None):
        """Save a stress detection result to the database"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor()
            
            cursor.execute(
                "INSERT INTO stress_results (user_id, stress_level, category, image_url, notes) "
                "VALUES (%s, %s, %s, %s, %s)",
                (user_id, stress_level, category, image_url, notes)
            )
            
            result_id = cursor.lastrowid
            self.connection.commit()
            cursor.close()
            
            # Check if stress level is severe and notification is needed
            if category == "high" and stress_level >= SEVERE_STRESS_THRESHOLD:
                self.notify_severe_stress(user_id, stress_level)
            
            return True, result_id
        except mysql.connector.Error as err:
            return False, f"Database error: {err}"
    
    def get_user_by_id(self, user_id):
        """Get user details by ID"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            cursor.close()
            return user
        except mysql.connector.Error as err:
            print(f"Database error: {err}")
            return None
    
    def get_user_results(self, user_id, limit=10):
        """Get stress results for a specific user"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            cursor.execute(
                "SELECT * FROM stress_results WHERE user_id = %s ORDER BY created_at DESC LIMIT %s",
                (user_id, limit)
            )
            
            results = cursor.fetchall()
            cursor.close()
            return results
        except mysql.connector.Error as err:
            print(f"Database error: {err}")
            return []
    
    def get_pending_users(self):
        """Get users pending approval"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            cursor.execute("SELECT * FROM users WHERE is_approved = FALSE")
            
            users = cursor.fetchall()
            cursor.close()
            return users
        except mysql.connector.Error as err:
            print(f"Database error: {err}")
            return []
    
    def get_high_stress_users(self, threshold=SEVERE_STRESS_THRESHOLD):
        """Get users with high stress levels"""
        if not self.connection:
            self.connect()
        
        try:
            cursor = self.connection.cursor(dictionary=True)
            
            query = """
            SELECT u.id, u.name, u.email, sr.stress_level, sr.created_at
            FROM users u
            JOIN stress_results sr ON u.id = sr.user_id
            WHERE sr.category = 'high' AND sr.stress_level >= %s
            ORDER BY sr.created_at DESC
            """
            
            cursor.execute(query, (threshold,))
            
            users = cursor.fetchall()
            cursor.close()
            return users
        except mysql.connector.Error as err:
            print(f"Database error: {err}")
            return []
    
    def notify_severe_stress(self, user_id, stress_level):
        """Notify admin about severe stress level and send email to user"""
        user = self.get_user_by_id(user_id)
        
        if not user:
            return False
        
        # Send email notification
        email_sent = self.send_stress_notification_email(user, stress_level)
        
        # In a real application, you might also:
        # 1. Create an in-app notification for admins
        # 2. Send a push notification via FCM/APNS
        # 3. Log the notification event
        
        return email_sent
    
    def send_stress_notification_email(self, user, stress_level):
        """Send an email notification about high stress level"""
        if not EMAIL_CONFIG['smtp_username'] or not EMAIL_CONFIG['smtp_password']:
            print("Email configuration incomplete")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = EMAIL_CONFIG['from_email']
            msg['To'] = user['email']
            msg['Subject'] = "StressDetect - High Stress Level Detected"
            
            # Email body
            body = f"""
            <html>
            <body>
                <h2>High Stress Level Alert</h2>
                <p>Dear {user['name']},</p>
                <p>Our system has detected that your current stress level is <strong>{stress_level:.1f}%</strong>, which is considered high.</p>
                <p>High stress levels can impact your health and wellbeing. Here are some suggestions:</p>
                <ul>
                    <li>Take short breaks during work</li>
                    <li>Practice deep breathing exercises</li>
                    <li>Ensure you're getting adequate rest</li>
                    <li>Consider speaking with your manager about workload</li>
                </ul>
                <p>Your health is important. Please take care of yourself.</p>
                <p>Best regards,<br>
                The StressDetect Team</p>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Connect to SMTP server
            server = smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port'])
            server.starttls()
            server.login(EMAIL_CONFIG['smtp_username'], EMAIL_CONFIG['smtp_password'])
            
            # Send email
            server.send_message(msg)
            server.quit()
            
            print(f"Email notification sent to {user['email']}")
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    
    def close(self):
        """Close the database connection"""
        if self.connection:
            self.connection.close()
            print("Database connection closed")


class StressDetectionAPI:
    def __init__(self):
        self.model = StressDetectionModel()
        self.db = DatabaseManager()
        
        # Create database tables if they don't exist
        self.db.create_tables()
    
    def process_image(self, image_path, user_id):
        """Process an uploaded image for stress detection"""
        try:
            # Read the image
            image = cv2.imread(image_path)
            
            if image is None:
                return {
                    "success": False,
                    "error": "Failed to read image file"
                }
            
            # Detect stress
            stress_level, category, face_coords = self.model.predict_stress(image)
            
            if stress_level is None:
                return {
                    "success": False,
                    "error": "No face detected in the image"
                }
            
            # Draw results on image
            result_image = self.model.draw_results(image.copy(), stress_level, category, face_coords)
            
            # Save result image (in a real app, would save to cloud storage)
            result_image_path = image_path.replace(".", "_result.")
            cv2.imwrite(result_image_path, result_image)
            
            # Save result to database
            success, result_id = self.db.save_stress_result(
                user_id, 
                stress_level, 
                category, 
                result_image_path
            )
            
            if not success:
                return {
                    "success": False,
                    "error": f"Failed to save result: {result_id}"
                }
            
            return {
                "success": True,
                "result": {
                    "id": result_id,
                    "stress_level": stress_level,
                    "category": category,
                    "image_url": result_image_path
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error processing image: {str(e)}"
            }
    
    def process_video_frame(self, frame, user_id=None):
        """Process a video frame for stress detection"""
        try:
            # Detect stress
            stress_level, category, face_coords = self.model.analyze_video_frame(frame)
            
            if stress_level is None:
                return {
                    "success": False,
                    "error": "No face detected in the frame"
                }
            
            # Draw results on frame
            result_frame = self.model.draw_results(frame.copy(), stress_level, category, face_coords)
            
            # If user_id is provided, save result to database
            result_id = None
            if user_id:
                success, result_id = self.db.save_stress_result(
                    user_id, 
                    stress_level, 
                    category
                )
            
            return {
                "success": True,
                "result": {
                    "id": result_id,
                    "stress_level": stress_level,
                    "category": category,
                    "result_frame": result_frame
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error processing video frame: {str(e)}"
            }
    
    def get_user_results(self, user_id, limit=10):
        """Get stress detection results for a user"""
        return self.db.get_user_results(user_id, limit)
    
    def get_pending_users(self):
        """Get users pending approval"""
        return self.db.get_pending_users()
    
    def approve_user(self, user_id):
        """Approve a user account"""
        return self.db.approve_user(user_id)
    
    def get_high_stress_users(self):
        """Get users with high stress levels"""
        return self.db.get_high_stress_users()
    
    def close(self):
        """Clean up resources"""
        self.db.close()


# Example usage in a Flask API
'''
from flask import Flask, request, jsonify
import numpy as np
import cv2
import base64

app = Flask(__name__)
api = StressDetectionAPI()

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image file provided"})
    
    user_id = request.form.get('user_id')
    if not user_id:
        return jsonify({"success": False, "error": "User ID is required"})
    
    image_file = request.files['image']
    image_path = f"uploads/{image_file.filename}"
    image_file.save(image_path)
    
    result = api.process_image(image_path, user_id)
    return jsonify(result)

@app.route('/api/users/pending', methods=['GET'])
def get_pending_users():
    users = api.get_pending_users()
    return jsonify({"success": True, "users": users})

@app.route('/api/users/approve', methods=['POST'])
def approve_user():
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({"success": False, "error": "User ID is required"})
    
    success, message = api.approve_user(user_id)
    return jsonify({"success": success, "message": message})

@app.route('/api/users/high-stress', methods=['GET'])
def get_high_stress_users():
    users = api.get_high_stress_users()
    return jsonify({"success": True, "users": users})

if __name__ == '__main__':
    app.run(debug=True)
'''
