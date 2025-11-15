"""
Authentication utilities for admin panel.
"""
from functools import wraps
from flask import session, redirect, url_for, request, flash
from werkzeug.security import check_password_hash, generate_password_hash
import os

def login_required(f):
    """Decorator to require login for admin routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session or not session.get('admin_logged_in'):
            if request.path.startswith('/admin'):
                return redirect(url_for('admin_login'))
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def verify_password(username, password):
    """Verify admin credentials"""
    from config import Config
    
    # Get credentials from environment or config
    admin_username = os.environ.get('ADMIN_USERNAME') or Config.ADMIN_USERNAME
    admin_password = os.environ.get('ADMIN_PASSWORD') or None
    admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH') or None
    
    # Check username
    if username != admin_username:
        return False
    
    # If password hash is set in environment, use it
    if admin_password_hash:
        return check_password_hash(admin_password_hash, password)
    
    # Otherwise, check plain password (for initial setup)
    if admin_password:
        return password == admin_password
    
    # Default password for initial setup (CHANGE THIS!)
    default_password = 'admin123'
    if password == default_password:
        # Generate hash for future use
        print("WARNING: Using default password! Set ADMIN_PASSWORD_HASH environment variable.")
        return True
    
    return False

def init_session(username):
    """Initialize admin session"""
    session['admin_logged_in'] = True
    session['admin_username'] = username
    session.permanent = True

def logout_session():
    """Clear admin session"""
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)

