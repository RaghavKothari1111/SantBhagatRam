# Admin Panel Documentation

## Overview

The admin panel provides a secure interface for managing website content including blogs and events.

## Features

- ✅ **Secure Authentication**: Login/logout with session management
- ✅ **Blog Management**: Add, edit, and delete blog posts
- ✅ **Event Management**: Add, edit, and delete events
- ✅ **Image Uploads**: Upload images for blogs and events
- ✅ **Bilingual Support**: Manage content in both Hindi and English
- ✅ **Responsive Design**: Works on desktop and mobile devices

## Accessing the Admin Panel

1. Navigate to: `http://yourdomain.com/admin/login`
2. Enter your credentials:
   - **Default Username**: `admin`
   - **Default Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Setting Up Secure Credentials

### Option 1: Using Environment Variables (Recommended)

1. Generate a password hash:
   ```bash
   python generate_password_hash.py
   ```

2. Set environment variables:
   ```bash
   export ADMIN_USERNAME=your_username
   export ADMIN_PASSWORD_HASH=generated_hash_here
   export SECRET_KEY=your_secret_key_here
   ```

### Option 2: Using .env File

1. Copy `.env.example` to `.env`
2. Edit `.env` and set your credentials
3. For production, use `ADMIN_PASSWORD_HASH` instead of `ADMIN_PASSWORD`

## Managing Blogs

### Adding a Blog

1. Go to **Blogs** → **Add New Blog**
2. Fill in the form:
   - **Title (Hindi/English)**: Blog post title in both languages
   - **Category (Hindi/English)**: Blog category
   - **Date (Hindi/English)**: Publication date
   - **Excerpt (Hindi/English)**: Short description
   - **Content (Hindi/English)**: Full blog content
   - **Image**: Upload a featured image (optional)
3. Click **Add Blog**

### Editing a Blog

1. Go to **Blogs** → Find the blog you want to edit
2. Click **Edit**
3. Modify the fields
4. Click **Update Blog**

### Deleting a Blog

1. Go to **Blogs** → Find the blog you want to delete
2. Click **Delete**
3. Confirm the deletion

## Managing Events

### Adding an Event

1. Go to **Events** → **Add New Event**
2. Fill in the form:
   - **Title (Hindi/English)**: Event title in both languages
   - **Date**: Event date (YYYY-MM-DD format)
   - **Time**: Event time (HH:MM format)
   - **Location (Hindi/English)**: Event location
   - **Description (Hindi/English)**: Event description
   - **Image**: Upload an event image (optional)
3. Click **Add Event**

### Editing an Event

1. Go to **Events** → Find the event you want to edit
2. Click **Edit**
3. Modify the fields
4. Click **Update Event**

### Deleting an Event

1. Go to **Events** → Find the event you want to delete
2. Click **Delete**
3. Confirm the deletion

## Image Upload Guidelines

- **Supported Formats**: PNG, JPG, JPEG, GIF, WEBP
- **Maximum Size**: 16MB per image
- **Recommended Size**: 1200x800px for best results
- **Storage**: Images are saved in `static/uploads/`

## Data Storage

- **Blogs**: Stored in `data/blogs_data.json`
- **Events**: Stored in `data/events_data.json`
- **Images**: Stored in `static/uploads/`

⚠️ **Backup these files regularly!**

## Security Best Practices

1. **Change Default Password**: Immediately after first login
2. **Use Password Hash**: Set `ADMIN_PASSWORD_HASH` instead of plain password
3. **Strong Secret Key**: Generate a strong random secret key
4. **HTTPS**: Use HTTPS in production and set `SESSION_COOKIE_SECURE=true`
5. **Regular Backups**: Backup data files regularly
6. **Access Control**: Restrict access to `/admin/*` routes if possible

## Troubleshooting

### Can't Login
- Verify credentials in environment variables or `.env` file
- Check that `SECRET_KEY` is set
- Clear browser cookies and try again

### Images Not Uploading
- Check `static/uploads/` directory exists and is writable
- Verify file size is under 16MB
- Check file format is supported

### Data Not Saving
- Check `data/` directory exists and is writable
- Verify JSON files are not corrupted
- Check application logs for errors

## Support

For issues or questions, check the `DEPLOYMENT.md` file or review the application logs.

