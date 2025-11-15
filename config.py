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
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # File upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # Data file paths
    BLOGS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'blogs_data.json')
    EVENTS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'events_data.json')
    PHOTOS_DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'photos_data.json')

# Ensure upload directory exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)

