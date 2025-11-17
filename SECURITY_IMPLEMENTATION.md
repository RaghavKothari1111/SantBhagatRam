# Secure Admin Panel - Security Implementation

## Overview
Production-ready 5-minute inactivity timeout with comprehensive security hardening.

## Security Features Implemented

### 1. Server-Side Timeout Enforcement (Primary)
- **Location**: `auth.py` → `login_required` decorator
- **Mechanism**: Checks `last_activity` timestamp on every admin route
- **Timeout**: 5 minutes (configurable in `config.py`)
- **Action**: Destroys session and redirects to `/admin/login` if timeout exceeded
- **Security**: Cannot be bypassed by client-side manipulation

### 2. Client-Side Failsafe Timeout (Secondary)
- **Location**: `templates/admin/base.html` → JavaScript
- **Mechanism**: Tracks activity (mousemove, click, keydown) and resets 5-minute timer
- **Action**: Redirects to `/admin/logout` after 5 minutes of inactivity
- **Purpose**: Secondary failsafe if backend check is somehow bypassed

### 3. Secure Cookie Configuration
- **HttpOnly**: `True` - Prevents XSS attacks from accessing cookies via JavaScript
- **Secure**: Configurable via `SESSION_COOKIE_SECURE` env var (set to `true` for HTTPS)
- **SameSite**: `Strict` - Prevents CSRF attacks by blocking cross-site cookie sending
- **Location**: `config.py` → `Config` class

### 4. Session ID Regeneration
- **Location**: `auth.py` → `init_session()`
- **Mechanism**: Forces session regeneration on login (`session.modified = True`)
- **Purpose**: Prevents session fixation attacks

### 5. User-Agent + IP Fingerprinting
- **Location**: `auth.py` → `get_client_fingerprint()` and `validate_session_security()`
- **Mechanism**: Creates SHA256 hash of User-Agent + IP address
- **Validation**: Checks fingerprint on every request
- **Action**: Logs out if fingerprint mismatch detected (prevents session hijacking)

### 6. CSRF Protection
- **Location**: `auth.py` → `csrf_protect` decorator and `validate_csrf_token()`
- **Mechanism**: Generates unique CSRF token per session
- **Validation**: Constant-time comparison using `secrets.compare_digest()`
- **Token Storage**: Session (`session['csrf_token']`)
- **Usage**: Add `@csrf_protect` decorator to POST/PUT/DELETE routes

## Code Structure

### Backend Files

#### `config.py`
```python
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() == 'true'
SESSION_COOKIE_SAMESITE = 'Strict'
ADMIN_INACTIVITY_TIMEOUT = timedelta(minutes=5)
```

#### `auth.py`
- `validate_session_security()` - Validates timeout and fingerprint
- `login_required()` - Decorator with security checks
- `get_client_fingerprint()` - Creates user-agent + IP hash
- `init_session()` - Initializes session with security features
- `csrf_protect()` - CSRF protection decorator
- `validate_csrf_token()` - Validates CSRF tokens

#### `app.py`
- Secure session cookie configuration
- `/admin/activity-ping` - Activity update endpoint
- `/admin/csrf-token` - CSRF token retrieval endpoint
- Context processor injects CSRF token into templates

### Frontend Files

#### `templates/admin/base.html`
- Client-side inactivity detection
- 5-minute failsafe timeout redirect to `/logout`
- Activity tracking (mousemove, click, keydown)
- Warning at 4 minutes
- Server ping every 30 seconds

## Usage Examples

### Protecting Routes with CSRF
```python
@app.route('/admin/blogs/delete/<blog_id>', methods=['POST'])
@login_required
@csrf_protect
def admin_delete_blog(blog_id):
    # Route is protected by both login and CSRF
    ...
```

### Using CSRF Token in Forms
```html
<form method="POST">
    <input type="hidden" name="csrf_token" value="{{ csrf_token }}">
    <!-- form fields -->
</form>
```

### Using CSRF Token in AJAX
```javascript
fetch('/admin/some-endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': '{{ csrf_token }}'
    },
    body: JSON.stringify(data)
});
```

## Security Flow

### Login Flow
1. User submits credentials
2. `verify_password()` validates credentials
3. `init_session()` creates session with:
   - `admin_logged_in = True`
   - `last_activity = current_time`
   - `client_fingerprint = hash(user_agent + IP)`
   - `csrf_token = random_token`
   - Session ID regenerated

### Request Flow (Every Admin Route)
1. `@login_required` decorator executes
2. `validate_session_security()` checks:
   - Is user logged in?
   - Has 5 minutes passed since last activity?
   - Does fingerprint match?
3. If any check fails → logout and redirect to login
4. If all pass → update `last_activity` and proceed

### Activity Ping Flow
1. Client sends POST to `/admin/activity-ping` every 30 seconds
2. Server validates session security
3. If valid → update `last_activity` and return success
4. If invalid → return 401, client redirects to login

### Client-Side Failsafe Flow
1. Timer starts on page load (5 minutes)
2. Activity events (mousemove, click, keydown) reset timer
3. Warning shown at 4 minutes
4. If no activity for 5 minutes → redirect to `/admin/logout`

## Environment Variables

```bash
# Required
SECRET_KEY=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=pbkdf2:sha256:...

# Recommended for Production
SESSION_COOKIE_SECURE=true  # Set to true when using HTTPS
ADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8  # Optional IP allowlist
```

## Testing Security

### Test Timeout
1. Login to admin panel
2. Wait 5 minutes without activity
3. Try to access any admin route
4. Should be redirected to login

### Test Fingerprint
1. Login to admin panel
2. Change User-Agent or IP (if possible)
3. Try to access admin route
4. Should be logged out with "Security validation failed" message

### Test CSRF
1. Login to admin panel
2. Make POST request without CSRF token
3. Should receive "CSRF validation failed" error

## Production Checklist

- [ ] Set `SESSION_COOKIE_SECURE=true` (HTTPS only)
- [ ] Use strong `SECRET_KEY` (32+ bytes)
- [ ] Use `ADMIN_PASSWORD_HASH` (not plain password)
- [ ] Configure `ADMIN_ALLOWED_IPS` if needed
- [ ] Test timeout functionality
- [ ] Test fingerprint validation
- [ ] Test CSRF protection
- [ ] Monitor session logs for security events

## Security Notes

1. **Backend is authoritative**: Client-side timeout is a failsafe only
2. **Fingerprint validation**: May cause issues with users behind proxies/VPNs
3. **CSRF tokens**: Regenerated on each login, valid for session lifetime
4. **Session cookies**: Cannot be accessed via JavaScript (HttpOnly)
5. **SameSite=Strict**: Prevents cross-site cookie sending entirely

## Troubleshooting

### Users getting logged out unexpectedly
- Check if IP address is changing (proxy/VPN)
- Check if User-Agent is changing
- Consider relaxing fingerprint validation if needed

### CSRF errors
- Ensure CSRF token is included in forms
- Check that token is being sent in AJAX headers
- Verify session is not expiring between page load and form submission

