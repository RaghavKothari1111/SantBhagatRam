# Deployment Guide

## Environment & Secrets

### 1. Create a local env file

```bash
cp example.env .env
```

Edit `.env` and fill in:
- `SECRET_KEY`: Strong random string (see step 3)
- `ADMIN_USERNAME`: Admin login ID
- `ADMIN_PASSWORD_HASH`: Output of the hashing step below
- `ADMIN_PASSWORD`: *(optional – dev only)* plain text fallback
- `ADMIN_ALLOWED_IPS`: *(optional)* comma-separated list like `1.2.3.4,5.6.7.8`
- `SESSION_COOKIE_SECURE`: `true` when serving over HTTPS
- `FLASK_DEBUG`: `false` for production

### 2. Generate Password Hash (recommended)

```bash
python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('YOUR-STRONG-PASSWORD'))"
```

Copy the output and set it as `ADMIN_PASSWORD_HASH` in your `.env` file.

### 3. Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and set it as `SECRET_KEY` in your `.env` file.

### 4. Directory Structure

Ensure these directories exist:
- `static/uploads/` - For uploaded images
- `data/` - For JSON data files

The application will create these automatically on first run.

## Production Deployment

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
- `ADMIN_ALLOWED_IPS` *(optional but recommended for admin lock-down)*
- `PORT` (if needed by your hosting provider)

## Deploying on Railway

Railway natively understands the included `Procfile` (`web: gunicorn app:app`). Recommended steps:

1. **Create a Railway project**
   ```bash
   railway init
   railway up
   ```
   Or use the Railway dashboard ➜ *New Project* ➜ *Deploy from GitHub* ➜ select this repo.

2. **Set environment variables** under *Variables*:

| Variable | Example | Notes |
| --- | --- | --- |
| `SECRET_KEY` | `railway-$(openssl rand -hex 32)` | Required |
| `ADMIN_USERNAME` | `admin` | Required |
| `ADMIN_PASSWORD_HASH` | *(hash output)* | Required for production logins |
| `FLASK_DEBUG` | `false` | Ensures debug is disabled |
| `SESSION_COOKIE_SECURE` | `true` | Enforce HTTPS cookies |
| `ADMIN_ALLOWED_IPS` | `12.34.56.78` | Optional allow-list for `/admin` |

3. **Persist uploads / data** *(optional but recommended)*  
   Railway’s ephemeral filesystem resets on each deploy. Create volumes if you need persistent uploads:
   ```bash
   railway volume create uploads --mountPath /app/static/uploads
   railway volume create data --mountPath /app/data
   ```
   Then redeploy so Gunicorn sees the mounted paths.

4. **Trigger a deploy**  
   Railway builds the image using `requirements.txt` and starts the Gunicorn process defined in `Procfile`.

5. **Add a custom domain (optional)** and force HTTPS inside Railway settings.

## Security Checklist

- [ ] Use `ADMIN_PASSWORD_HASH` (not `ADMIN_PASSWORD`) in production.
- [ ] Generate and set a unique `SECRET_KEY`.
- [ ] Keep `.env`/Railway variables private—never commit secrets.
- [ ] Set `FLASK_DEBUG=false` and `SESSION_COOKIE_SECURE=true`.
- [ ] (Optional) Restrict `/admin/*` via `ADMIN_ALLOWED_IPS`.
- [ ] Serve the site via HTTPS.
- [ ] Regularly backup the `data/` folder and `static/uploads/`.
- [ ] Rotate admin credentials periodically.

## Data Backup

Backup these files regularly:
- `data/blogs_data.json`
- `data/events_data.json`
- `static/uploads/` directory

## Accessing Admin Panel

- **Login URL**: `https://yourdomain.com/admin/login`
- **Dashboard**: `https://yourdomain.com/admin`
- **Blogs**: `https://yourdomain.com/admin/blogs`
- **Events**: `https://yourdomain.com/admin/events`

## Features

- ✅ Secure authentication
- ✅ Blog management (Add, Edit, Delete)
- ✅ Event management (Add, Edit, Delete)
- ✅ Image uploads
- ✅ Bilingual support (Hindi/English)
- ✅ Session management
- ✅ Responsive admin interface

## Troubleshooting

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

