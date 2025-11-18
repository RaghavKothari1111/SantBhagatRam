"""
Configuration file for the application.
Use environment variables for sensitive data in production.
"""
import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production-12345'
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME') or 'admin'
    ADMIN_PASSWORD_HASH = os.environ.get('ADMIN_PASSWORD_HASH') or None  # Set via environment variable
    ADMIN_ALLOWED_IPS = os.environ.get('ADMIN_ALLOWED_IPS', '')
    # Secure cookie settings - production ready
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True  # Prevent XSS attacks
    SESSION_COOKIE_SAMESITE = 'Strict'  # Strict CSRF protection
    SESSION_COOKIE_NAME = 'admin_session'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Inactivity timeout: logout after 5 minutes of inactivity
    ADMIN_INACTIVITY_TIMEOUT = timedelta(minutes=5)
    
    # CSRF protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None  # No time limit on CSRF tokens
    
    # File upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # Cloudinary settings
    CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET', '')
    USE_CLOUDINARY = os.environ.get('USE_CLOUDINARY', 'false').lower() == 'true'
    
    # Data file paths
    BLOGS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'blogs_data.json')
    EVENTS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'events_data.json')
    PHOTOS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'photos_data.json')
    SLIDER_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'slider_data.json')
    VIDEOS_DROPDOWN_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'videos_dropdown_data.json')
    NAVBAR_DROPDOWNS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'navbar_dropdowns_data.json')
    ADMIN_SESSION_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'admin_session_data.json')
    OBJECTIVES_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'objectives_data.json')

# Ensure upload directory exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)

