
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Dropout, Flatten
from tensorflow.keras.optimizers import Adam
import os
import base64
from io import BytesIO
from PIL import Image

# Path to pre-trained model weights (would be provided in production)
MODEL_PATH = 'models/stress_detection_model.h5'

class StressDetector:
    def __init__(self):
        self.model = self._build_model()
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Load pre-trained model if exists
        if os.path.exists(MODEL_PATH):
            try:
                self.model.load_weights(MODEL_PATH)
                print("Loaded pre-trained model weights")
            except Exception as e:
                print(f"Error loading model: {e}")
    
    def _build_model(self):
        """Build CNN model for stress detection"""
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            MaxPooling2D(pool_size=(2, 2)),
            
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            
            Conv2D(128, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            
            Flatten(),
            Dense(256, activation='relu'),
            Dropout(0.5),
            Dense(64, activation='relu'),
            Dropout(0.3),
            Dense(1, activation='sigmoid')  # Outputs stress level 0-1
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.0001),
            loss='mean_squared_error',
            metrics=['mae']
        )
        
        return model
    
    def detect_faces(self, image):
        """Detect faces in image"""
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        return faces, gray
    
    def preprocess_face(self, face_img):
        """Preprocess face image for the model"""
        # Resize to 48x48 (model input size)
        face_img = cv2.resize(face_img, (48, 48))
        
        # Normalize pixel values
        face_img = face_img / 255.0
        
        # Reshape for model input
        face_img = np.expand_dims(face_img, axis=-1)  # Add channel dimension
        face_img = np.expand_dims(face_img, axis=0)   # Add batch dimension
        
        return face_img
    
    def process_image(self, image_data):
        """Process image data and detect stress levels"""
        # Check if image_data is base64 string
        if isinstance(image_data, str) and "base64" in image_data:
            # Extract the base64 part
            base64_data = image_data.split(',')[1] if ',' in image_data else image_data
            
            # Decode base64 to image
            image_bytes = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_bytes))
            image = np.array(image)
            
            # Convert RGB to BGR (OpenCV format)
            if len(image.shape) == 3 and image.shape[2] == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        else:
            # Assume it's a file path
            image = cv2.imread(image_data)
        
        if image is None:
            return {
                "success": False,
                "error": "Failed to process image"
            }
        
        # Detect faces
        faces, gray = self.detect_faces(image)
        
        if len(faces) == 0:
            return {
                "success": False,
                "error": "No faces detected in the image"
            }
        
        results = []
        
        # Process each face
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Preprocess face for model
            processed_face = self.preprocess_face(face_roi)
            
            # Predict stress level
            stress_prediction = self.model.predict(processed_face)[0][0]
            
            # Scale to 0-100 range
            stress_score = float(stress_prediction * 100)
            
            # Determine stress level category
            if stress_score < 40:
                stress_category = "low"
            elif stress_score < 70:
                stress_category = "medium"
            else:
                stress_category = "high"
            
            # Draw rectangle on the image
            color = (0, 255, 0)  # Green for low stress
            if stress_category == "medium":
                color = (0, 165, 255)  # Orange for medium stress
            elif stress_category == "high":
                color = (0, 0, 255)  # Red for high stress
            
            cv2.rectangle(image, (x, y), (x+w, y+h), color, 2)
            
            # Add text with stress level
            text = f"{stress_category.upper()}: {stress_score:.1f}%"
            cv2.putText(image, text, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Add result to list
            results.append({
                "face_position": {"x": x, "y": y, "width": w, "height": h},
                "stress_score": stress_score,
                "stress_category": stress_category
            })
        
        # Convert result image to base64 for sending back to frontend
        _, buffer = cv2.imencode('.jpg', image)
        result_image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "faces_detected": len(faces),
            "results": results,
            "result_image": f"data:image/jpeg;base64,{result_image_base64}"
        }
