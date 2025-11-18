"""
Authentication utilities for admin panel.
"""
from functools import wraps
from flask import session, redirect, url_for, request, flash
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import os
import hashlib
import secrets
import uuid
import json
from config import Config

def validate_session_security():
    """Validate session security (session token, fingerprint, timeout)"""
    # Check if logged in
    if 'admin_logged_in' not in session or not session.get('admin_logged_in'):
        return False, 'not_logged_in'
    
    # 1. Single-session validation - check if session token matches active token
    active_token = get_active_session_token()
    current_token = session.get('session_token')
    
    if not active_token or not current_token or active_token != current_token:
        # Someone logged in elsewhere or token mismatch
        return False, 'session_token_mismatch'
    
    # 2. Check inactivity timeout - absolute 5 minute timeout
    if not check_session_activity():
        return False, 'timeout'
    
    # 3. Validate client fingerprint to prevent session hijacking
    stored_fingerprint = session.get('client_fingerprint')
    current_fingerprint = get_client_fingerprint()
    
    if not stored_fingerprint or stored_fingerprint != current_fingerprint:
        return False, 'fingerprint_mismatch'
    
    return True, 'valid'

def login_required(f):
    """Decorator to require login for admin routes with security checks"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Validate session security
        is_valid, reason = validate_session_security()
        
        if not is_valid:
            logout_session()
            if reason == 'timeout':
                flash('Your session has expired due to inactivity. Please login again.', 'error')
            elif reason == 'session_token_mismatch':
                flash('You have been logged out because you logged in from another device/browser.', 'error')
            elif reason == 'fingerprint_mismatch':
                flash('Security validation failed. Please login again.', 'error')
            else:
                flash('Please login to access this page.', 'error')
            return redirect(url_for('admin_login'))
        
        # Update last activity time
        update_session_activity()
        
        return f(*args, **kwargs)
    return decorated_function

def verify_password(username, password):
    """Verify admin credentials"""
    from config import Config
    
    # Get credentials from environment or config
    admin_username = os.environ.get('ADMIN_USERNAME') or Config.ADMIN_USERNAME
    admin_password = os.environ.get('ADMIN_PASSWORD') or None
    admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH') or Config.ADMIN_PASSWORD_HASH
    
    # Check username
    if username != admin_username:
        return False
    
    # If password hash is set, prefer it
    if admin_password_hash:
        return check_password_hash(admin_password_hash, password)
    
    # Otherwise, allow plain password via env (useful for local dev only)
    if admin_password:
        return password == admin_password
    
    print("ERROR: Admin password is not configured. Set ADMIN_PASSWORD_HASH (recommended) or ADMIN_PASSWORD.")
    return False

def get_client_fingerprint():
    """Generate a hash of user-agent + IP for session validation"""
    user_agent = request.headers.get('User-Agent', '')
    # Get real IP (handles proxies)
    forwarded_for = request.headers.get('X-Forwarded-For', '')
    if forwarded_for:
        ip = forwarded_for.split(',')[0].strip()
    else:
        ip = request.remote_addr or 'unknown'
    
    # Create hash of user-agent + IP
    fingerprint_data = f"{user_agent}:{ip}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()

def get_active_session_token():
    """Get the currently active session token from file"""
    try:
        if os.path.exists(Config.ADMIN_SESSION_DATA_FILE):
            with open(Config.ADMIN_SESSION_DATA_FILE, 'r') as f:
                data = json.load(f)
                return data.get('session_token')
    except (json.JSONDecodeError, IOError):
        pass
    return None

def set_active_session_token(token):
    """Set the active session token in file (invalidates previous sessions)"""
    try:
        os.makedirs(os.path.dirname(Config.ADMIN_SESSION_DATA_FILE), exist_ok=True)
        data = {'session_token': token}
        with open(Config.ADMIN_SESSION_DATA_FILE, 'w') as f:
            json.dump(data, f)
            f.flush()
            os.fsync(f.fileno())
    except (IOError, OSError):
        pass

def clear_active_session_token():
    """Clear the active session token"""
    try:
        if os.path.exists(Config.ADMIN_SESSION_DATA_FILE):
            os.remove(Config.ADMIN_SESSION_DATA_FILE)
    except (IOError, OSError):
        pass

def init_session(username):
    """Initialize admin session with security hardening and session token"""
    # Generate unique session token
    token = str(uuid.uuid4())
    
    # Store token in file - this invalidates any previous session
    set_active_session_token(token)
    
    # Regenerate session ID to prevent session fixation
    session.permanent = True
    session['admin_logged_in'] = True
    session['admin_username'] = username
    session['session_token'] = token
    session['last_activity'] = datetime.now().isoformat()
    
    # Store client fingerprint for session hijacking prevention
    session['client_fingerprint'] = get_client_fingerprint()
    
    # Generate CSRF token
    session['csrf_token'] = secrets.token_urlsafe(32)
    
    # Force session regeneration (new session ID)
    session.modified = True

def logout_session():
    """Clear admin session completely"""
    # Only clear active token if this session's token matches (don't clear new session's token)
    current_token = session.get('session_token')
    active_token = get_active_session_token()
    if current_token and current_token == active_token:
        clear_active_session_token()
    
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    session.pop('session_token', None)
    session.pop('last_activity', None)
    session.pop('client_fingerprint', None)
    session.pop('csrf_token', None)
    session.clear()

def update_session_activity():
    """Update the last activity timestamp in the session"""
    session['last_activity'] = datetime.now().isoformat()
    session.modified = True

def check_session_activity():
    """Check if the session is still valid based on inactivity timeout"""
    from config import Config
    
    if 'last_activity' not in session:
        return False
    
    try:
        last_activity = datetime.fromisoformat(session['last_activity'])
        timeout = Config.ADMIN_INACTIVITY_TIMEOUT
        now = datetime.now()
        time_since_activity = now - last_activity
        
        # Check if time since last activity exceeds the timeout (5 minutes)
        if time_since_activity > timeout:
            return False
        return True
    except (ValueError, TypeError) as e:
        # If there's an error parsing the timestamp, session is invalid
        return False

def validate_csrf_token():
    """Validate CSRF token from request"""
    if request.method == 'GET':
        return True  # GET requests don't need CSRF protection
    
    # Get token from form or header
    token_from_request = request.form.get('csrf_token') or request.headers.get('X-CSRF-Token')
    token_from_session = session.get('csrf_token')
    
    if not token_from_request or not token_from_session:
        return False
    
    # Use constant-time comparison to prevent timing attacks
    return secrets.compare_digest(token_from_request, token_from_session)

def csrf_protect(f):
    """Decorator to require CSRF token for POST/PUT/DELETE requests"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
            if not validate_csrf_token():
                flash('CSRF validation failed. Please try again.', 'error')
                return redirect(request.referrer or url_for('admin_dashboard'))
        return f(*args, **kwargs)
    return decorated_function

