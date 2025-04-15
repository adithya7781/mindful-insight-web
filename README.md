
# Stress Detection Web Application

A comprehensive real-time stress detection application with user and admin interfaces, offering 85-90% accuracy in stress level assessment.

## Features

- Two-tier authentication system (IT professionals and HR admins)
- Real-time stress detection via webcam
- Image upload for stress analysis
- Dashboard with stress level visualization
- Admin approval system
- Email notifications for severe stress cases
- Database integration for result tracking

## Tech Stack

### Frontend
- React.js
- TypeScript
- Tailwind CSS
- Shadcn UI Components

### Backend
- Python Flask API
- TensorFlow/Keras for ML model
- OpenCV for image processing
- MySQL database
- JWT authentication

## Setup Instructions

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
venv\Scripts\activate
```
- macOS/Linux:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables in a `.env` file:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stress_detection

SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=notifications@your-domain.com

SECRET_KEY=your_secret_key_for_jwt
```

6. Initialize the database:
```bash
mysql -u root -p
```

```sql
CREATE DATABASE stress_detection;
```

7. Start the Flask server:
```bash
python app.py
```

## Usage

1. Register as an IT professional or admin (HR)
2. Admin needs to approve IT professional accounts
3. IT professionals can:
   - Take stress scans via webcam
   - Upload images for analysis
   - View their stress history
4. Admins can:
   - Approve new users
   - Monitor stress levels across the organization
   - Get alerts for severe stress cases

## ML Model

The stress detection model uses a Convolutional Neural Network trained on facial features to detect stress indicators with 85-90% accuracy. The model analyzes:

- Facial micro-expressions
- Muscle tension
- Eye movement patterns
- Skin tone variations

Results are categorized as low, medium, or high stress with a numerical score from 0-100.

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── types/
│   ├── public/
│   └── package.json
│
└── backend/
    ├── app.py
    ├── stress_detection.py
    ├── requirements.txt
    └── uploads/
```

## License

MIT
