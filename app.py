from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, send_from_directory, abort
from datetime import datetime
import json
import os
import uuid
from werkzeug.utils import secure_filename

from data.events_data import EVENTS_DATA
from config import Config
from auth import (
    login_required, verify_password, init_session, logout_session, 
    update_session_activity, check_session_activity, validate_session_security,
    get_client_fingerprint
)
from data_manager import (
    get_all_blogs, get_blog_by_id, add_blog, update_blog, delete_blog,
    get_all_events, get_event_by_id, add_event, update_event, delete_event,
    get_all_galleries, get_gallery_by_id, add_gallery, update_gallery, delete_gallery,
    get_all_slider_images, get_slider_image_by_id, add_slider_image, update_slider_image,
    delete_slider_image, update_slider_order,
    save_json_data, migrate_blog_ids_to_slugs, update_blog_order, update_event_order,
    migrate_event_orders,
    get_videos_dropdown_data, add_video_category, update_video_category, delete_video_category,
    add_video_link, update_video_link, delete_video_link, update_video_order, update_social_media,
    get_navbar_dropdowns_data, get_dropdown_for_nav_item, update_dropdown_for_nav_item,
    toggle_dropdown_enabled, add_dropdown_column, update_dropdown_column, delete_dropdown_column,
    add_dropdown_item, update_dropdown_item, delete_dropdown_item,
    update_dropdown_column_order, update_dropdown_item_order, update_global_social_media,
    get_all_objectives, get_objective_by_id, add_objective, update_objective, delete_objective,
    update_objective_order, get_latest_youtube_videos
)
from storage import storage_manager
from image_utils import generate_responsive_image_attrs, get_responsive_image_url, generate_srcset

app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY
ALLOWED_ADMIN_IPS = [ip.strip() for ip in Config.ADMIN_ALLOWED_IPS.split(',') if ip.strip()]

# Add Jinja2 filters for responsive images
@app.template_filter('responsive_image')
def responsive_image_filter(url, sizes=None, default_width=1200):
    """Jinja2 filter for responsive images"""
    return generate_responsive_image_attrs(url, sizes, default_width)

@app.template_filter('image_srcset')
def image_srcset_filter(url):
    """Jinja2 filter for srcset generation"""
    return generate_srcset(url)

@app.template_filter('optimize_image')
def optimize_image_filter(url, width=None, quality='auto', format='auto'):
    """Jinja2 filter for single optimized image URL"""
    return get_responsive_image_url(url, width, quality, format)

# Configure secure session cookies
app.config['SESSION_COOKIE_HTTPONLY'] = Config.SESSION_COOKIE_HTTPONLY
app.config['SESSION_COOKIE_SECURE'] = Config.SESSION_COOKIE_SECURE
app.config['SESSION_COOKIE_SAMESITE'] = Config.SESSION_COOKIE_SAMESITE
app.config['SESSION_COOKIE_NAME'] = Config.SESSION_COOKIE_NAME
app.config['PERMANENT_SESSION_LIFETIME'] = Config.PERMANENT_SESSION_LIFETIME

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

@app.before_request
def enforce_admin_security():
    """Enforce admin security: IP restriction, session validation, and inactivity timeout"""
    # Only check admin routes
    if not request.path.startswith('/admin'):
        return
    
    # Optional IP allow-list for /admin routes
    if ALLOWED_ADMIN_IPS:
        forwarded_for = request.headers.get('X-Forwarded-For', '')
        candidate_ip = forwarded_for.split(',')[0].strip() if forwarded_for else (request.remote_addr or '')
        if candidate_ip not in ALLOWED_ADMIN_IPS:
            abort(403)
    
    # Skip security checks for login and logout routes
    if request.path in ['/admin/login', '/admin/logout']:
        return
    
    # Check if logged in
    if 'admin_logged_in' not in session or not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    
    # Import here to avoid circular imports
    from auth import validate_session_security, logout_session, update_session_activity
    from datetime import datetime
    from config import Config
    
    # Validate session security (includes inactivity timeout and single-session check)
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
    
    # Only update last activity if session is valid (after all checks pass)
    # This ensures inactivity timeout is checked BEFORE updating the timestamp
    update_session_activity()

@app.context_processor
def inject_current_year():
    """Inject variables into all templates"""
    videos_dropdown_data = get_videos_dropdown_data()
    navbar_dropdowns_data = get_navbar_dropdowns_data()
    
    # Inject CSRF token for admin templates
    csrf_token = session.get('csrf_token', '') if 'admin_logged_in' in session else ''
    
    return dict(
        current_year=datetime.now().year,
        videos_dropdown_data=videos_dropdown_data,
        navbar_dropdowns_data=navbar_dropdowns_data,
        csrf_token=csrf_token
    )

@app.route('/')
def home():
    migrate_blog_ids_to_slugs()
    blogs = get_all_blogs()
    home_blogs = blogs[:3]
    slider_images = get_all_slider_images()
    objectives = get_all_objectives()
    return render_template('home.html', home_blogs=home_blogs, slider_images=slider_images, objectives=objectives)

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
@app.route('/photos/<gallery_id>')
def photos(gallery_id=None):
    galleries = get_all_galleries()
    return render_template(
        'photos.html',
        galleries=galleries,
        galleries_json=json.dumps(galleries, ensure_ascii=False),
        gallery_id=gallery_id
    )

@app.route('/videos')
def videos():
    return render_template('videos.html')

@app.route('/api/videos')
def api_videos():
    limit = request.args.get('limit', default=50, type=int)
    youtube_videos = get_latest_youtube_videos(limit=limit)
    return jsonify(youtube_videos)

@app.route('/donate')
def donate():
    objectives = get_all_objectives()
    return render_template('donate.html', objectives=objectives)

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
        return storage_manager.save_file(file, folder='uploads')
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

@app.route('/admin/activity-ping', methods=['POST'])
def admin_activity_ping():
    """Update session activity - backend enforces timeout and security (cannot be bypassed)"""
    # Validate session security (includes timeout and fingerprint check)
    is_valid, reason = validate_session_security()
    
    if not is_valid:
        logout_session()
        return jsonify({'success': False, 'expired': True, 'reason': reason}), 401
    
    # Session is valid - update activity timestamp
    update_session_activity()
    
    # Calculate actual time remaining until timeout
    from datetime import datetime
    from config import Config
    last_activity = datetime.fromisoformat(session['last_activity'])
    timeout = Config.ADMIN_INACTIVITY_TIMEOUT
    time_since_activity = datetime.now() - last_activity
    time_remaining = (timeout - time_since_activity).total_seconds() * 1000  # Convert to milliseconds
    
    # Ensure non-negative
    time_remaining = max(0, int(time_remaining))
    
    return jsonify({
        'success': True, 
        'expired': False,
        'timeRemaining': time_remaining
    })

@app.route('/admin/csrf-token', methods=['GET'])
@login_required
def get_csrf_token():
    """Get CSRF token for AJAX requests"""
    return jsonify({'csrf_token': session.get('csrf_token', '')})

@app.route('/admin')
@login_required
def admin_dashboard():
    blogs = get_all_blogs()
    events = get_all_events()
    galleries = get_all_galleries()
    objectives = get_all_objectives()
    return render_template('admin/dashboard.html', 
                         blog_count=len(blogs), 
                         event_count=len(events),
                         gallery_count=len(galleries),
                         objective_count=len(objectives))

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

# Objectives Management Routes
@app.route('/admin/objectives')
@login_required
def admin_objectives():
    objectives = get_all_objectives()
    return render_template('admin/objectives.html', objectives=objectives)

@app.route('/admin/objectives/add', methods=['GET', 'POST'])
@login_required
def admin_add_objective():
    if request.method == 'POST':
        objective_data = {
            'title': request.form.get('title', '').strip(),
            'titleEn': request.form.get('titleEn', '').strip(),
            'description': request.form.get('description', '').strip(),
            'descriptionEn': request.form.get('descriptionEn', '').strip(),
            'icon': request.form.get('icon', '').strip(),
        }
        
        if add_objective(objective_data):
            flash('Objective added successfully!', 'success')
            return redirect(url_for('admin_objectives'))
        else:
            flash('Error adding objective', 'error')
    
    return render_template('admin/objective_form.html', objective=None)

@app.route('/admin/objectives/edit/<objective_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_objective(objective_id):
    objective = get_objective_by_id(objective_id)
    if not objective:
        flash('Objective not found', 'error')
        return redirect(url_for('admin_objectives'))
    
    if request.method == 'POST':
        objective_data = {
            'title': request.form.get('title', '').strip(),
            'titleEn': request.form.get('titleEn', '').strip(),
            'description': request.form.get('description', '').strip(),
            'descriptionEn': request.form.get('descriptionEn', '').strip(),
            'icon': request.form.get('icon', '').strip(),
        }
        
        if update_objective(objective_id, objective_data):
            flash('Objective updated successfully!', 'success')
            return redirect(url_for('admin_objectives'))
        else:
            flash('Error updating objective', 'error')
    
    return render_template('admin/objective_form.html', objective=objective)

@app.route('/admin/objectives/delete/<objective_id>', methods=['POST'])
@login_required
def admin_delete_objective(objective_id):
    if delete_objective(objective_id):
        flash('Objective deleted successfully!', 'success')
    else:
        flash('Error deleting objective', 'error')
    return redirect(url_for('admin_objectives'))

@app.route('/admin/objectives/reorder', methods=['POST'])
@login_required
def admin_reorder_objectives():
    data = request.get_json()
    objective_ids = data.get('objective_ids', [])
    if update_objective_order(objective_ids):
        return jsonify({'success': True, 'message': 'Objective order updated successfully'})
    return jsonify({'success': False, 'message': 'Error updating objective order'}), 400

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

@app.route('/admin/photos/<gallery_id>/delete-photo/<photo_id>', methods=['DELETE'])
@login_required
def admin_delete_photo(gallery_id, photo_id):
    """Delete a single photo from a gallery via AJAX"""
    try:
        gallery = get_gallery_by_id(gallery_id)
        if not gallery:
            return jsonify({'success': False, 'error': 'Gallery not found'}), 404
        
        # Find and remove the photo
        photos = gallery.get('photos', [])
        photo_to_delete = None
        updated_photos = []
        
        for photo in photos:
            if str(photo.get('id')) == str(photo_id):
                photo_to_delete = photo
            else:
                updated_photos.append(photo)
        
        if not photo_to_delete:
            return jsonify({'success': False, 'error': 'Photo not found'}), 404
        
        # Delete the file from storage (cloud or local)
        photo_url = photo_to_delete.get('url')
        if photo_url:
            storage_manager.delete_file(photo_url)
        
        # Update gallery with remaining photos
        gallery['photos'] = updated_photos
        
        # Update cover image if it was the deleted photo
        if gallery.get('coverImage') == photo_url:
            if updated_photos:
                gallery['coverImage'] = updated_photos[0].get('url', '')
            else:
                gallery['coverImage'] = ''
        
        # Save updated gallery
        if update_gallery(gallery_id, gallery):
            return jsonify({'success': True, 'message': 'Photo deleted successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to update gallery'}), 500
            
    except Exception as e:
        print(f"Error deleting photo: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Slider Management Routes
@app.route('/admin/slider')
@login_required
def admin_slider():
    images = get_all_slider_images()
    return render_template('admin/slider.html', images=images)

@app.route('/admin/slider/add', methods=['GET', 'POST'])
@login_required
def admin_add_slider_image():
    if request.method == 'POST':
        image_file = request.files.get('image')
        if not image_file or not image_file.filename:
            flash('Please select an image', 'error')
            return render_template('admin/slider_form.html', image=None)
        
        image_url = save_uploaded_file(image_file)
        if not image_url:
            flash('Error uploading image', 'error')
            return render_template('admin/slider_form.html', image=None)
        
        image_data = {
            'imageUrl': image_url,
            'alt': request.form.get('alt', '').strip() or 'Slider Image'
        }
        
        if add_slider_image(image_data):
            flash('Slider image added successfully!', 'success')
            return redirect(url_for('admin_slider'))
        flash('Error adding slider image', 'error')
    
    return render_template('admin/slider_form.html', image=None)

@app.route('/admin/slider/edit/<image_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_slider_image(image_id):
    image = get_slider_image_by_id(image_id)
    if not image:
        flash('Slider image not found', 'error')
        return redirect(url_for('admin_slider'))
    
    if request.method == 'POST':
        image_data = {
            'imageUrl': image.get('imageUrl'),
            'alt': request.form.get('alt', '').strip() or 'Slider Image'
        }
        
        # Handle new image upload
        image_file = request.files.get('image')
        if image_file and image_file.filename:
            new_image_url = save_uploaded_file(image_file)
            if new_image_url:
                image_data['imageUrl'] = new_image_url
        
        if update_slider_image(image_id, image_data):
            flash('Slider image updated successfully!', 'success')
            return redirect(url_for('admin_slider'))
        flash('Error updating slider image', 'error')
    
    return render_template('admin/slider_form.html', image=image)

@app.route('/admin/slider/delete/<image_id>', methods=['POST'])
@login_required
def admin_delete_slider_image(image_id):
    if delete_slider_image(image_id):
        flash('Slider image deleted successfully!', 'success')
    else:
        flash('Error deleting slider image', 'error')
    return redirect(url_for('admin_slider'))

@app.route('/admin/slider/reorder', methods=['POST'])
@login_required
def admin_reorder_slider():
    data = request.get_json()
    image_ids = data.get('image_ids', [])
    if update_slider_order(image_ids):
        return jsonify({'success': True})
    return jsonify({'success': False}), 400

# Videos Dropdown Admin Routes
@app.route('/admin/videos-dropdown')
@login_required
def admin_videos_dropdown():
    """Videos dropdown management page"""
    data = get_videos_dropdown_data()
    return render_template('admin/videos_dropdown.html', 
                         categories=data.get('categories', []),
                         links=data.get('links', []),
                         social_media=data.get('social_media', {}))

@app.route('/admin/videos-dropdown/category/add', methods=['GET', 'POST'])
@login_required
def admin_add_video_category():
    """Add a new video category"""
    if request.method == 'POST':
        category_data = {
            'title': request.form.get('title', '').strip(),
            'link': request.form.get('link', '').strip(),
            'font_size': request.form.get('font_size', 'large')
        }
        if category_data['title'] and category_data['link']:
            success, category_id = add_video_category(category_data)
            if success:
                flash('Category added successfully!', 'success')
                return redirect(url_for('admin_videos_dropdown'))
            else:
                flash('Error adding category', 'error')
        else:
            flash('Title and link are required', 'error')
    
    return render_template('admin/video_category_form.html')

@app.route('/admin/videos-dropdown/category/edit/<category_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_video_category(category_id):
    """Edit a video category"""
    data = get_videos_dropdown_data()
    category = None
    for cat in data.get('categories', []):
        if str(cat.get('id')) == str(category_id):
            category = cat
            break
    
    if not category:
        flash('Category not found', 'error')
        return redirect(url_for('admin_videos_dropdown'))
    
    if request.method == 'POST':
        category_data = {
            'title': request.form.get('title', '').strip(),
            'link': request.form.get('link', '').strip(),
            'font_size': request.form.get('font_size', 'large')
        }
        if category_data['title'] and category_data['link']:
            if update_video_category(category_id, category_data):
                flash('Category updated successfully!', 'success')
                return redirect(url_for('admin_videos_dropdown'))
            else:
                flash('Error updating category', 'error')
        else:
            flash('Title and link are required', 'error')
    
    return render_template('admin/video_category_form.html', category=category)

@app.route('/admin/videos-dropdown/category/delete/<category_id>', methods=['POST'])
@login_required
def admin_delete_video_category(category_id):
    """Delete a video category"""
    if delete_video_category(category_id):
        flash('Category deleted successfully!', 'success')
    else:
        flash('Error deleting category', 'error')
    return redirect(url_for('admin_videos_dropdown'))

@app.route('/admin/videos-dropdown/link/add', methods=['GET', 'POST'])
@login_required
def admin_add_video_link():
    """Add a new video link"""
    if request.method == 'POST':
        link_data = {
            'title': request.form.get('title', '').strip(),
            'link': request.form.get('link', '').strip(),
            'category': request.form.get('category', '').strip(),
            'font_size': request.form.get('font_size', 'small')
        }
        if link_data['title'] and link_data['link']:
            success, link_id = add_video_link(link_data)
            if success:
                flash('Link added successfully!', 'success')
                return redirect(url_for('admin_videos_dropdown'))
            else:
                flash('Error adding link', 'error')
        else:
            flash('Title and link are required', 'error')
    
    return render_template('admin/video_link_form.html')

@app.route('/admin/videos-dropdown/link/edit/<link_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_video_link(link_id):
    """Edit a video link"""
    data = get_videos_dropdown_data()
    link = None
    for l in data.get('links', []):
        if str(l.get('id')) == str(link_id):
            link = l
            break
    
    if not link:
        flash('Link not found', 'error')
        return redirect(url_for('admin_videos_dropdown'))
    
    if request.method == 'POST':
        link_data = {
            'title': request.form.get('title', '').strip(),
            'link': request.form.get('link', '').strip(),
            'category': request.form.get('category', '').strip(),
            'font_size': request.form.get('font_size', 'small')
        }
        if link_data['title'] and link_data['link']:
            if update_video_link(link_id, link_data):
                flash('Link updated successfully!', 'success')
                return redirect(url_for('admin_videos_dropdown'))
            else:
                flash('Error updating link', 'error')
        else:
            flash('Title and link are required', 'error')
    
    return render_template('admin/video_link_form.html', link=link)

@app.route('/admin/videos-dropdown/link/delete/<link_id>', methods=['POST'])
@login_required
def admin_delete_video_link(link_id):
    """Delete a video link"""
    if delete_video_link(link_id):
        flash('Link deleted successfully!', 'success')
    else:
        flash('Error deleting link', 'error')
    return redirect(url_for('admin_videos_dropdown'))

@app.route('/admin/videos-dropdown/reorder', methods=['POST'])
@login_required
def admin_reorder_videos():
    """Update video dropdown item order"""
    data = request.get_json()
    item_type = data.get('type')  # 'category' or 'link'
    item_ids = data.get('item_ids', [])
    if update_video_order(item_type, item_ids):
        return jsonify({'success': True})
    return jsonify({'success': False}), 400

@app.route('/admin/videos-dropdown/social-media', methods=['GET', 'POST'])
@login_required
def admin_edit_social_media():
    """Edit social media links"""
    data = get_videos_dropdown_data()
    social_media = data.get('social_media', {})
    
    if request.method == 'POST':
        social_data = {
            'youtube': request.form.get('youtube', '').strip(),
            'instagram': request.form.get('instagram', '').strip()
        }
        if update_social_media(social_data):
            flash('Social media links updated successfully!', 'success')
            return redirect(url_for('admin_videos_dropdown'))
        else:
            flash('Error updating social media links', 'error')
    
    return render_template('admin/social_media_form.html', social_media=social_media)

# Generic Navbar Dropdowns Admin Routes
@app.route('/admin/navbar-dropdowns')
@login_required
def admin_navbar_dropdowns():
    """Main navbar dropdowns management page"""
    data = get_navbar_dropdowns_data()
    nav_items = ['blog', 'projects', 'photos', 'videos', 'events']
    return render_template('admin/navbar_dropdowns.html',
                         dropdowns_data=data.get('dropdowns', {}),
                         social_media=data.get('social_media', {}),
                         nav_items=nav_items)

@app.route('/admin/navbar-dropdowns/<nav_item>')
@login_required
def admin_manage_dropdown(nav_item):
    """Manage dropdown for a specific navbar item"""
    if nav_item == 'home':
        flash('Home cannot have a dropdown', 'error')
        return redirect(url_for('admin_navbar_dropdowns'))
    
    dropdown_data = get_dropdown_for_nav_item(nav_item)
    selected_column = None
    column_id = request.args.get('column')
    
    # Find the selected column in Python (more reliable than template matching)
    if column_id:
        for col in dropdown_data.get('columns', []):
            if str(col.get('id', '')) == str(column_id):
                selected_column = col
                break
    
    return render_template('admin/manage_dropdown.html',
                         nav_item=nav_item,
                         dropdown_data=dropdown_data,
                         selected_column=selected_column,
                         column_id=column_id)

@app.route('/admin/navbar-dropdowns/<nav_item>/toggle', methods=['POST'])
@login_required
def admin_toggle_dropdown(nav_item):
    """Enable or disable dropdown for a navbar item"""
    if nav_item == 'home':
        return jsonify({'success': False, 'error': 'Home cannot have dropdown'}), 400
    
    enabled = request.json.get('enabled', False)
    if toggle_dropdown_enabled(nav_item, enabled):
        return jsonify({'success': True})
    return jsonify({'success': False}), 400

@app.route('/admin/navbar-dropdowns/<nav_item>/column/add', methods=['GET', 'POST'])
@login_required
def admin_add_dropdown_column(nav_item):
    """Add a column to a dropdown"""
    if request.method == 'POST':
        column_data = {
            'title': request.form.get('title', '').strip(),
            'title_hi': request.form.get('title_hi', '').strip(),
            'heading': request.form.get('heading', '').strip(),
            'heading_hi': request.form.get('heading_hi', '').strip(),
            'items': []
        }
        if column_data['title'] and column_data['title_hi']:
            success, column_id = add_dropdown_column(nav_item, column_data)
            if success:
                flash('Column added successfully!', 'success')
                return redirect(url_for('admin_manage_dropdown', nav_item=nav_item))
            else:
                flash('Error adding column', 'error')
        else:
            flash('Both English and Hindi titles are required', 'error')
    
    return render_template('admin/dropdown_column_form.html', nav_item=nav_item)

@app.route('/admin/navbar-dropdowns/<nav_item>/column/edit/<column_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_dropdown_column(nav_item, column_id):
    """Edit a dropdown column"""
    dropdown_data = get_dropdown_for_nav_item(nav_item)
    column = None
    for col in dropdown_data.get('columns', []):
        if str(col.get('id')) == str(column_id):
            column = col
            break
    
    if not column:
        flash('Column not found', 'error')
        return redirect(url_for('admin_manage_dropdown', nav_item=nav_item))
    
    if request.method == 'POST':
        column_data = {
            'title': request.form.get('title', '').strip(),
            'title_hi': request.form.get('title_hi', '').strip(),
            'heading': request.form.get('heading', '').strip(),
            'heading_hi': request.form.get('heading_hi', '').strip(),
            'items': column.get('items', [])
        }
        if column_data['title'] and column_data['title_hi']:
            if update_dropdown_column(nav_item, column_id, column_data):
                flash('Column updated successfully!', 'success')
                return redirect(url_for('admin_manage_dropdown', nav_item=nav_item))
            else:
                flash('Error updating column', 'error')
        else:
            flash('Both English and Hindi titles are required', 'error')
    
    return render_template('admin/dropdown_column_form.html', nav_item=nav_item, column=column)

@app.route('/admin/navbar-dropdowns/<nav_item>/column/delete/<column_id>', methods=['POST'])
@login_required
def admin_delete_dropdown_column(nav_item, column_id):
    """Delete a dropdown column"""
    if delete_dropdown_column(nav_item, column_id):
        flash('Column deleted successfully!', 'success')
    else:
        flash('Error deleting column', 'error')
    return redirect(url_for('admin_manage_dropdown', nav_item=nav_item))

@app.route('/admin/navbar-dropdowns/<nav_item>/column/<column_id>/item/add', methods=['GET', 'POST'])
@login_required
def admin_add_dropdown_item(nav_item, column_id):
    """Add an item to a dropdown column"""
    if request.method == 'POST':
        item_data = {
            'title': request.form.get('title', '').strip(),
            'title_hi': request.form.get('title_hi', '').strip(),
            'link': request.form.get('link', '').strip(),
            'font_size': request.form.get('font_size', 'small')
        }
        if item_data['title'] and item_data['title_hi'] and item_data['link']:
            success, item_id = add_dropdown_item(nav_item, column_id, item_data)
            if success:
                flash('Item added successfully!', 'success')
                return redirect(url_for('admin_manage_dropdown', nav_item=nav_item) + f'?column={column_id}')
            else:
                flash('Error adding item', 'error')
        else:
            flash('English title, Hindi title, and link are required', 'error')
    
    return render_template('admin/dropdown_item_form.html', nav_item=nav_item, column_id=column_id)

@app.route('/admin/navbar-dropdowns/<nav_item>/column/<column_id>/item/edit/<item_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_dropdown_item(nav_item, column_id, item_id):
    """Edit an item in a dropdown column"""
    dropdown_data = get_dropdown_for_nav_item(nav_item)
    item = None
    for col in dropdown_data.get('columns', []):
        if str(col.get('id')) == str(column_id):
            for itm in col.get('items', []):
                if str(itm.get('id')) == str(item_id):
                    item = itm
                    break
            break
    
    if not item:
        flash('Item not found', 'error')
        return redirect(url_for('admin_manage_dropdown', nav_item=nav_item))
    
    if request.method == 'POST':
        item_data = {
            'title': request.form.get('title', '').strip(),
            'title_hi': request.form.get('title_hi', '').strip(),
            'link': request.form.get('link', '').strip(),
            'font_size': request.form.get('font_size', 'small')
        }
        if item_data['title'] and item_data['title_hi'] and item_data['link']:
            if update_dropdown_item(nav_item, column_id, item_id, item_data):
                flash('Item updated successfully!', 'success')
                return redirect(url_for('admin_manage_dropdown', nav_item=nav_item) + f'?column={column_id}')
            else:
                flash('Error updating item', 'error')
        else:
            flash('English title, Hindi title, and link are required', 'error')
    
    return render_template('admin/dropdown_item_form.html', nav_item=nav_item, column_id=column_id, item=item)

@app.route('/admin/navbar-dropdowns/<nav_item>/column/<column_id>/item/delete/<item_id>', methods=['POST'])
@login_required
def admin_delete_dropdown_item(nav_item, column_id, item_id):
    """Delete an item from a dropdown column"""
    if delete_dropdown_item(nav_item, column_id, item_id):
        flash('Item deleted successfully!', 'success')
    else:
        flash('Error deleting item', 'error')
    return redirect(url_for('admin_manage_dropdown', nav_item=nav_item) + f'?column={column_id}')

@app.route('/admin/navbar-dropdowns/reorder', methods=['POST'])
@login_required
def admin_reorder_dropdown():
    """Update dropdown column or item order"""
    data = request.get_json()
    nav_item = data.get('nav_item')
    column_id = data.get('column_id')
    column_ids = data.get('column_ids', [])
    item_ids = data.get('item_ids', [])
    
    if column_ids:
        # Reorder columns
        if update_dropdown_column_order(nav_item, column_ids):
            return jsonify({'success': True})
    elif item_ids and column_id:
        # Reorder items within a column
        if update_dropdown_item_order(nav_item, column_id, item_ids):
            return jsonify({'success': True})
    
    return jsonify({'success': False}), 400

@app.route('/admin/navbar-dropdowns/social-media', methods=['GET', 'POST'])
@login_required
def admin_edit_global_social_media():
    """Edit global social media links"""
    data = get_navbar_dropdowns_data()
    social_media = data.get('social_media', {})
    
    if request.method == 'POST':
        social_data = {
            'youtube': request.form.get('youtube', '').strip(),
            'instagram': request.form.get('instagram', '').strip()
        }
        if update_global_social_media(social_data):
            flash('Social media links updated successfully!', 'success')
            return redirect(url_for('admin_navbar_dropdowns'))
        else:
            flash('Error updating social media links', 'error')
    
    return render_template('admin/global_social_media_form.html', social_media=social_media)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    # Enable debug mode in development (disabled in production via environment variable)
    debug_mode = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode, use_reloader=True)