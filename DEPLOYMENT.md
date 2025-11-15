# Deployment Guide

## Admin Panel Setup

### 1. Environment Configuration

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set:
- `SECRET_KEY`: Generate a strong random secret key
- `ADMIN_USERNAME`: Your admin username
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`: Your admin password (use hash for production)
- `SESSION_COOKIE_SECURE`: Set to `true` if using HTTPS

### 2. Generate Password Hash (Recommended for Production)

```bash
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('your-password'))"
```

Copy the output and set it as `ADMIN_PASSWORD_HASH` in your `.env` file.

### 3. Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and set it as `SECRET_KEY` in your `.env` file.

### 4. Initial Setup

1. **Default Credentials** (for first-time setup):
   - Username: `admin`
   - Password: `admin123`
   
   **⚠️ IMPORTANT**: Change these immediately after first login!

2. **Access Admin Panel**:
   - Navigate to `/admin/login`
   - Login with your credentials
   - Change password via environment variables

### 5. Directory Structure

Ensure these directories exist:
- `static/uploads/` - For uploaded images
- `data/` - For JSON data files

The application will create these automatically on first run.

### 6. Production Deployment

#### Using Gunicorn (Recommended)

```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

#### Environment Variables for Production

Set these in your hosting environment:
- `SECRET_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` (recommended)
- `SESSION_COOKIE_SECURE=true` (if using HTTPS)
- `FLASK_DEBUG=false` (IMPORTANT: Disable debug mode in production!)
- `PORT` (if needed by your hosting provider)

### 7. Security Checklist

- [ ] Change default admin password
- [ ] Use `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`
- [ ] Set `SESSION_COOKIE_SECURE=true` for HTTPS
- [ ] Use a strong `SECRET_KEY`
- [ ] Keep `.env` file secure (never commit it)
- [ ] Regularly backup `data/` directory
- [ ] Use HTTPS in production
- [ ] Restrict access to `/admin/*` routes if possible

### 8. Data Backup

Backup these files regularly:
- `data/blogs_data.json`
- `data/events_data.json`
- `static/uploads/` directory

### 9. Accessing Admin Panel

- **Login URL**: `https://yourdomain.com/admin/login`
- **Dashboard**: `https://yourdomain.com/admin`
- **Blogs**: `https://yourdomain.com/admin/blogs`
- **Events**: `https://yourdomain.com/admin/events`

### 10. Features

- ✅ Secure authentication
- ✅ Blog management (Add, Edit, Delete)
- ✅ Event management (Add, Edit, Delete)
- ✅ Image uploads
- ✅ Bilingual support (Hindi/English)
- ✅ Session management
- ✅ Responsive admin interface

### Troubleshooting

**Can't login?**
- Check `.env` file exists and has correct credentials
- Verify `SECRET_KEY` is set
- Clear browser cookies and try again

**Uploads not working?**
- Check `static/uploads/` directory exists and is writable
- Verify file size is under 16MB
- Check file format is allowed (PNG, JPG, JPEG, GIF, WEBP)

**Data not saving?**
- Check `data/` directory exists and is writable
- Verify JSON files are not corrupted
- Check application logs for errors

