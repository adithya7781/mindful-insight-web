
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        # Get database configuration from environment variables
        self.host = os.environ.get('DB_HOST', 'localhost')
        self.database = os.environ.get('DB_NAME', 'stress_detection')
        self.user = os.environ.get('DB_USER', 'root')
        self.password = os.environ.get('DB_PASSWORD', '')
        
        self.connection = None
        self.connect()
        self.create_tables()
    
    def connect(self):
        """Connect to the MySQL database"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                database=self.database,
                user=self.user,
                password=self.password
            )
            
            if self.connection.is_connected():
                logger.info(f"Connected to MySQL database: {self.database}")
        except Error as e:
            logger.error(f"Error connecting to MySQL database: {e}")
            
            # Fall back to in-memory storage if database connection fails
            self.users = []
            self.stress_results = []
            self.in_memory = True
            logger.info("Using in-memory storage instead of database")
    
    def create_tables(self):
        """Create necessary tables if they don't exist"""
        if not hasattr(self, 'in_memory'):
            try:
                cursor = self.connection.cursor()
                
                # Create users table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role ENUM('admin', 'user') DEFAULT 'user',
                    is_approved BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """)
                
                # Create stress_results table
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS stress_results (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    stress_level ENUM('low', 'medium', 'high') NOT NULL,
                    stress_score FLOAT NOT NULL,
                    image_path VARCHAR(255),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
                """)
                
                self.connection.commit()
                logger.info("Database tables created successfully")
                cursor.close()
            except Error as e:
                logger.error(f"Error creating tables: {e}")
                
                # If we can't create tables, initialize in-memory storage
                self.users = []
                self.stress_results = []
                self.in_memory = True
                logger.info("Using in-memory storage instead of database")
        else:
            # Initialize in-memory data structures
            self.users = []
            self.stress_results = []
    
    def close(self):
        """Close the database connection"""
        if hasattr(self, 'connection') and self.connection and not hasattr(self, 'in_memory'):
            if self.connection.is_connected():
                self.connection.close()
                logger.info("MySQL connection closed")
    
    # User management methods
    def add_user(self, name, email, password, role='user'):
        """Add a new user"""
        user_id = self._generate_id()
        
        if hasattr(self, 'in_memory'):
            # Check if email already exists
            if any(u.get('email') == email for u in self.users):
                return False, "Email already exists"
            
            # Add user to in-memory storage
            self.users.append({
                'id': user_id,
                'name': name,
                'email': email,
                'password': password,
                'role': role,
                'is_approved': role == 'admin',  # Auto-approve admins
                'created_at': datetime.now()
            })
            
            return True, "User registered successfully"
        else:
            try:
                cursor = self.connection.cursor()
                
                # Check if email already exists
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    cursor.close()
                    return False, "Email already exists"
                
                # Insert new user
                is_approved = 1 if role == 'admin' else 0  # Auto-approve admins
                cursor.execute(
                    "INSERT INTO users (id, name, email, password, role, is_approved) VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_id, name, email, password, role, is_approved)
                )
                
                self.connection.commit()
                cursor.close()
                return True, "User registered successfully"
            except Error as e:
                logger.error(f"Error adding user: {e}")
                return False, f"Database error: {str(e)}"
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        if hasattr(self, 'in_memory'):
            for user in self.users:
                if user.get('id') == user_id:
                    # Return a copy without password
                    user_copy = user.copy()
                    user_copy.pop('password', None)
                    return user_copy
            return None
        else:
            try:
                cursor = self.connection.cursor(dictionary=True)
                cursor.execute("SELECT id, name, email, role, is_approved, created_at FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()
                cursor.close()
                return user
            except Error as e:
                logger.error(f"Error getting user: {e}")
                return None
    
    def get_user_by_email(self, email):
        """Get user by email (including password for authentication)"""
        if hasattr(self, 'in_memory'):
            for user in self.users:
                if user.get('email') == email:
                    return user.copy()
            return None
        else:
            try:
                cursor = self.connection.cursor(dictionary=True)
                cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = cursor.fetchone()
                cursor.close()
                return user
            except Error as e:
                logger.error(f"Error getting user by email: {e}")
                return None
    
    def approve_user(self, user_id):
        """Approve a user"""
        if hasattr(self, 'in_memory'):
            for user in self.users:
                if user.get('id') == user_id:
                    user['is_approved'] = True
                    return True, "User approved successfully"
            return False, "User not found"
        else:
            try:
                cursor = self.connection.cursor()
                cursor.execute("UPDATE users SET is_approved = TRUE WHERE id = %s", (user_id,))
                self.connection.commit()
                
                if cursor.rowcount == 0:
                    cursor.close()
                    return False, "User not found"
                
                cursor.close()
                return True, "User approved successfully"
            except Error as e:
                logger.error(f"Error approving user: {e}")
                return False, f"Database error: {str(e)}"
    
    def get_pending_users(self):
        """Get users pending approval"""
        if hasattr(self, 'in_memory'):
            result = []
            for user in self.users:
                if not user.get('is_approved') and user.get('role') == 'user':
                    user_copy = {
                        'id': user.get('id'),
                        'name': user.get('name'),
                        'email': user.get('email'),
                        'registeredAt': user.get('created_at').isoformat()
                    }
                    result.append(user_copy)
            return result
        else:
            try:
                cursor = self.connection.cursor(dictionary=True)
                cursor.execute(
                    "SELECT id, name, email, created_at as registeredAt FROM users WHERE is_approved = FALSE AND role = 'user'"
                )
                users = cursor.fetchall()
                cursor.close()
                return users
            except Error as e:
                logger.error(f"Error getting pending users: {e}")
                return []
    
    # Stress results methods
    def add_stress_result(self, user_id, stress_level, stress_score, image_path=None, notes=None):
        """Add a new stress result"""
        result_id = self._generate_id()
        
        if hasattr(self, 'in_memory'):
            self.stress_results.append({
                'id': result_id,
                'user_id': user_id,
                'stress_level': stress_level,
                'stress_score': stress_score,
                'image_path': image_path,
                'notes': notes,
                'created_at': datetime.now()
            })
            return True
        else:
            try:
                cursor = self.connection.cursor()
                cursor.execute(
                    "INSERT INTO stress_results (id, user_id, stress_level, stress_score, image_path, notes) VALUES (%s, %s, %s, %s, %s, %s)",
                    (result_id, user_id, stress_level, stress_score, image_path, notes)
                )
                self.connection.commit()
                cursor.close()
                return True
            except Error as e:
                logger.error(f"Error adding stress result: {e}")
                return False
    
    def get_stress_results(self, user_id, limit=10):
        """Get stress results for a user"""
        if hasattr(self, 'in_memory'):
            # Filter and sort results for the user
            user_results = [r for r in self.stress_results if r.get('user_id') == user_id]
            
            # Sort by created_at (newest first)
            user_results.sort(key=lambda x: x.get('created_at'), reverse=True)
            
            # Apply limit
            if limit > 0:
                user_results = user_results[:limit]
            
            # Format datetime to string
            for result in user_results:
                result['created_at'] = result['created_at'].isoformat()
            
            return user_results
        else:
            try:
                cursor = self.connection.cursor(dictionary=True)
                
                query = "SELECT * FROM stress_results WHERE user_id = %s ORDER BY created_at DESC"
                params = (user_id,)
                
                if limit > 0:
                    query += " LIMIT %s"
                    params = (user_id, limit)
                
                cursor.execute(query, params)
                results = cursor.fetchall()
                cursor.close()
                return results
            except Error as e:
                logger.error(f"Error getting stress results: {e}")
                return []
    
    def get_high_stress_users(self):
        """Get users with high stress levels"""
        if hasattr(self, 'in_memory'):
            # Group results by user
            user_stress = {}
            
            for result in self.stress_results:
                user_id = result.get('user_id')
                stress_score = result.get('stress_score')
                
                if user_id not in user_stress:
                    user_stress[user_id] = []
                
                user_stress[user_id].append(stress_score)
            
            # Calculate average stress score for each user
            high_stress_users = []
            
            for user_id, scores in user_stress.items():
                avg_score = sum(scores) / len(scores)
                
                if avg_score >= 80:  # High stress threshold
                    user = self.get_user_by_id(user_id)
                    if user:
                        high_stress_users.append({
                            'id': user.get('id'),
                            'name': user.get('name'),
                            'stressLevel': round(avg_score, 1)
                        })
            
            return high_stress_users
        else:
            try:
                cursor = self.connection.cursor(dictionary=True)
                
                # Get users with average stress score >= 80
                cursor.execute("""
                SELECT u.id, u.name, AVG(sr.stress_score) as stressLevel
                FROM users u
                JOIN stress_results sr ON u.id = sr.user_id
                GROUP BY u.id, u.name
                HAVING AVG(sr.stress_score) >= 80
                ORDER BY stressLevel DESC
                """)
                
                high_stress_users = cursor.fetchall()
                
                # Round the stress level to 1 decimal place
                for user in high_stress_users:
                    user['stressLevel'] = round(user['stressLevel'], 1)
                
                cursor.close()
                return high_stress_users
            except Error as e:
                logger.error(f"Error getting high stress users: {e}")
                return []
    
    def _generate_id(self):
        """Generate a unique ID"""
        import uuid
        return str(uuid.uuid4())
