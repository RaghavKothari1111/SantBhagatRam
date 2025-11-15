from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_from_directory
from datetime import datetime
import json
import os
import uuid
from werkzeug.utils import secure_filename

from data.events_data import EVENTS_DATA
from config import Config
from auth import login_required, verify_password, init_session, logout_session
from data_manager import (
    get_all_blogs, get_blog_by_id, add_blog, update_blog, delete_blog,
    get_all_events, get_event_by_id, add_event, update_event, delete_event,
    get_all_galleries, get_gallery_by_id, add_gallery, update_gallery, delete_gallery,
    save_json_data, migrate_blog_ids_to_slugs, update_blog_order, update_event_order,
    migrate_event_orders
)

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY

# Security headers
@app.after_request
def set_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    if request.is_secure or os.environ.get('FORCE_HTTPS', '').lower() == 'true':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

@app.context_processor
def inject_current_year():
    return dict(current_year=datetime.now().year)

@app.route('/')
def home():
    migrate_blog_ids_to_slugs()
    blogs = get_all_blogs()
    home_blogs = blogs[:3]
    return render_template('home.html', home_blogs=home_blogs)

@app.route('/blog')
def blog():
    blogs = get_all_blogs()
    # Migrate old numeric IDs to slugs on first access
    migrate_blog_ids_to_slugs()
    return render_template('blog.html', blogs=blogs)

@app.route('/blog/<blog_id>')
def blog_detail(blog_id):
    blog = get_blog_by_id(blog_id)
    if not blog:
        flash('Blog not found', 'error')
        return redirect(url_for('blog'))
    
    # Get all blogs for "Related Posts" or navigation
    all_blogs = get_all_blogs()
    return render_template('blog_detail.html', blog=blog, all_blogs=all_blogs)

@app.route('/projects')
def projects():
    return render_template('projects.html')

@app.route('/project1')
def project1():
    return render_template('project1.html')

@app.route('/project2')
def project2():
    return render_template('project2.html')

@app.route('/project3')
def project3():
    return render_template('project3.html')

@app.route('/photos')
def photos():
    galleries = get_all_galleries()
    return render_template(
        'photos.html',
        galleries=galleries,
        galleries_json=json.dumps(galleries, ensure_ascii=False)
    )

@app.route('/videos')
def videos():
    return render_template('videos.html')

@app.route('/donate')
def donate():
    return render_template('donate.html')

@app.route('/events')
def events():
    # Try to load from JSON, fallback to Python file
    events_data = get_all_events()
    if not events_data:
        # Migrate existing events to JSON on first run
        events_data = EVENTS_DATA
        save_json_data(Config.EVENTS_DATA_FILE, events_data)
    
    return render_template(
        'events.html',
        events=events_data,
        events_json=json.dumps(events_data, ensure_ascii=False),
    )


# Helper function for file uploads
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """Save uploaded file and return the URL path"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add UUID to prevent conflicts
        unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        return f"/static/uploads/{unique_filename}"
    return None

def build_gallery_payload(existing_gallery=None):
    """Collect gallery/category data from admin form"""
    gallery = {
        'title': request.form.get('title', '').strip(),
        'titleEn': request.form.get('titleEn', '').strip(),
        'date': request.form.get('date', '').strip(),
        'dateEn': request.form.get('dateEn', '').strip(),
        'description': request.form.get('description', '').strip(),
        'descriptionEn': request.form.get('descriptionEn', '').strip(),
    }
    
    if existing_gallery:
        gallery['order'] = existing_gallery.get('order', 0)
    photos = []
    if existing_gallery:
        photos = existing_gallery.get('photos', []).copy()
        delete_ids = set(request.form.getlist('delete_photos'))
        if delete_ids:
            photos = [photo for photo in photos if str(photo.get('id')) not in delete_ids]
    
    uploaded_photos = request.files.getlist('photos')
    caption_hi = request.form.get('photoCaption', '').strip()
    caption_en = request.form.get('photoCaptionEn', '').strip()
    for uploaded in uploaded_photos:
        if uploaded and uploaded.filename:
            image_url = save_uploaded_file(uploaded)
            if image_url:
                photos.append({
                    'id': uuid.uuid4().hex,
                    'url': image_url,
                    'caption': caption_hi,
                    'captionEn': caption_en
                })
    
    gallery['photos'] = photos
    
    cover_image = existing_gallery.get('coverImage') if existing_gallery else ''
    cover_file = request.files.get('cover_image')
    if cover_file and cover_file.filename:
        uploaded_cover = save_uploaded_file(cover_file)
        if uploaded_cover:
            cover_image = uploaded_cover
    
    if gallery['photos']:
        photo_urls = [photo.get('url') for photo in gallery['photos']]
        if not cover_image or cover_image not in photo_urls:
            cover_image = photo_urls[0]
    gallery['coverImage'] = cover_image or ''
    
    return gallery

# Admin Routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        if verify_password(username, password):
            init_session(username)
            flash('Login successful!', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('admin/login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_session()
    flash('Logged out successfully', 'success')
    return redirect(url_for('admin_login'))

@app.route('/admin')
@login_required
def admin_dashboard():
    blogs = get_all_blogs()
    events = get_all_events()
    galleries = get_all_galleries()
    return render_template('admin/dashboard.html', 
                         blog_count=len(blogs), 
                         event_count=len(events),
                         gallery_count=len(galleries))

# Blog Management Routes
@app.route('/admin/blogs')
@login_required
def admin_blogs():
    blogs = get_all_blogs()
    return render_template('admin/blogs.html', blogs=blogs)

@app.route('/admin/blogs/add', methods=['GET', 'POST'])
@login_required
def admin_add_blog():
    if request.method == 'POST':
        blog_data = {
            'title': request.form.get('title', '').strip(),
            'titleEn': request.form.get('titleEn', '').strip(),
            'excerpt': request.form.get('excerpt', '').strip(),
            'excerptEn': request.form.get('excerptEn', '').strip(),
            'content': request.form.get('content', '').strip(),
            'contentEn': request.form.get('contentEn', '').strip(),
            'category': request.form.get('category', '').strip(),
            'categoryEn': request.form.get('categoryEn', '').strip(),
            'date': request.form.get('date', '').strip(),
            'dateEn': request.form.get('dateEn', '').strip(),
        }
        
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                image_url = save_uploaded_file(image_file)
                if image_url:
                    blog_data['image'] = image_url
        
        if add_blog(blog_data):
            flash('Blog added successfully!', 'success')
            return redirect(url_for('admin_blogs'))
        else:
            flash('Error adding blog', 'error')
    
    return render_template('admin/blog_form.html', blog=None)

@app.route('/admin/blogs/edit/<blog_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_blog(blog_id):
    blog = get_blog_by_id(blog_id)
    if not blog:
        flash('Blog not found', 'error')
        return redirect(url_for('admin_blogs'))
    
    if request.method == 'POST':
        blog_data = {
            'title': request.form.get('title', '').strip(),
            'titleEn': request.form.get('titleEn', '').strip(),
            'excerpt': request.form.get('excerpt', '').strip(),
            'excerptEn': request.form.get('excerptEn', '').strip(),
            'content': request.form.get('content', '').strip(),
            'contentEn': request.form.get('contentEn', '').strip(),
            'category': request.form.get('category', '').strip(),
            'categoryEn': request.form.get('categoryEn', '').strip(),
            'date': request.form.get('date', '').strip(),
            'dateEn': request.form.get('dateEn', '').strip(),
        }
        
        # Keep existing image if no new one uploaded
        blog_data['image'] = blog.get('image', '')
        
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                image_url = save_uploaded_file(image_file)
                if image_url:
                    blog_data['image'] = image_url
        
        if update_blog(blog_id, blog_data):
            flash('Blog updated successfully!', 'success')
            return redirect(url_for('admin_blogs'))
        else:
            flash('Error updating blog', 'error')
    
    return render_template('admin/blog_form.html', blog=blog)

@app.route('/admin/blogs/delete/<blog_id>', methods=['POST'])
@login_required
def admin_delete_blog(blog_id):
    if delete_blog(blog_id):
        flash('Blog deleted successfully!', 'success')
    else:
        flash('Error deleting blog', 'error')
    return redirect(url_for('admin_blogs'))

@app.route('/admin/blogs/reorder', methods=['POST'])
@login_required
def admin_reorder_blogs():
    data = request.get_json()
    blog_ids = data.get('blog_ids', [])
    if update_blog_order(blog_ids):
        return jsonify({'success': True, 'message': 'Blog order updated successfully'})
    return jsonify({'success': False, 'message': 'Error updating blog order'}), 400

# Event Management Routes
@app.route('/admin/events')
@login_required
def admin_events():
    # Migrate event orders on first access
    migrate_event_orders()
    events = get_all_events()
    return render_template('admin/events.html', events=events)

@app.route('/admin/events/add', methods=['GET', 'POST'])
@login_required
def admin_add_event():
    if request.method == 'POST':
        event_data = {
            'title': request.form.get('title', '').strip(),
            'titleEn': request.form.get('titleEn', '').strip(),
            'date': request.form.get('date', '').strip(),
            'time': request.form.get('time', '').strip(),
            'location': request.form.get('location', '').strip(),
            'locationEn': request.form.get('locationEn', '').strip(),
            'description': request.form.get('description', '').strip(),
            'descriptionEn': request.form.get('descriptionEn', '').strip(),
        }
        
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                image_url = save_uploaded_file(image_file)
                if image_url:
                    event_data['image'] = image_url
        
        if add_event(event_data):
            flash('Event added successfully!', 'success')
            return redirect(url_for('admin_events'))
        else:
            flash('Error adding event', 'error')
    
    return render_template('admin/event_form.html', event=None)

@app.route('/admin/events/edit/<event_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_event(event_id):
    event = get_event_by_id(event_id)
    if not event:
        flash('Event not found', 'error')
        return redirect(url_for('admin_events'))
    
    if request.method == 'POST':
        event_data = {
            'title': request.form.get('title', '').strip(),
            'titleEn': request.form.get('titleEn', '').strip(),
            'date': request.form.get('date', '').strip(),
            'time': request.form.get('time', '').strip(),
            'location': request.form.get('location', '').strip(),
            'locationEn': request.form.get('locationEn', '').strip(),
            'description': request.form.get('description', '').strip(),
            'descriptionEn': request.form.get('descriptionEn', '').strip(),
        }
        
        # Keep existing image if no new one uploaded
        event_data['image'] = event.get('image', '')
        
        # Handle image upload
        if 'image' in request.files:
            image_file = request.files['image']
            if image_file and image_file.filename:
                image_url = save_uploaded_file(image_file)
                if image_url:
                    event_data['image'] = image_url
        
        if update_event(event_id, event_data):
            flash('Event updated successfully!', 'success')
            return redirect(url_for('admin_events'))
        else:
            flash('Error updating event', 'error')
    
    return render_template('admin/event_form.html', event=event)

@app.route('/admin/events/delete/<event_id>', methods=['POST'])
@login_required
def admin_delete_event(event_id):
    if delete_event(event_id):
        flash('Event deleted successfully!', 'success')
    else:
        flash('Error deleting event', 'error')
    return redirect(url_for('admin_events'))

@app.route('/admin/events/reorder', methods=['POST'])
@login_required
def admin_reorder_events():
    data = request.get_json()
    event_ids = data.get('event_ids', [])
    if update_event_order(event_ids):
        return jsonify({'success': True, 'message': 'Event order updated successfully'})
    return jsonify({'success': False, 'message': 'Error updating event order'}), 400

# Photo Gallery Management Routes
@app.route('/admin/photos')
@login_required
def admin_photos():
    galleries = get_all_galleries()
    return render_template('admin/photos.html', galleries=galleries)

@app.route('/admin/photos/add', methods=['GET', 'POST'])
@login_required
def admin_add_photo_gallery():
    if request.method == 'POST':
        gallery_data = build_gallery_payload()
        if add_gallery(gallery_data):
            flash('Photo category added successfully!', 'success')
            return redirect(url_for('admin_photos'))
        flash('Error adding photo category', 'error')
    return render_template('admin/photo_form.html', gallery=None)

@app.route('/admin/photos/edit/<gallery_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_photo_gallery(gallery_id):
    gallery = get_gallery_by_id(gallery_id)
    if not gallery:
        flash('Photo category not found', 'error')
        return redirect(url_for('admin_photos'))
    
    if request.method == 'POST':
        gallery_data = build_gallery_payload(existing_gallery=gallery)
        if update_gallery(gallery_id, gallery_data):
            flash('Photo category updated successfully!', 'success')
            return redirect(url_for('admin_photos'))
        flash('Error updating photo category', 'error')
    
    return render_template('admin/photo_form.html', gallery=gallery)

@app.route('/admin/photos/delete/<gallery_id>', methods=['POST'])
@login_required
def admin_delete_photo_gallery(gallery_id):
    if delete_gallery(gallery_id):
        flash('Photo category deleted successfully!', 'success')
    else:
        flash('Error deleting photo category', 'error')
    return redirect(url_for('admin_photos'))

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    # Enable debug mode in development (disabled in production via environment variable)
    debug_mode = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode, use_reloader=True)