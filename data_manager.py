"""
Data management utilities for blogs, events, and photo galleries.
Handles reading/writing JSON data files.
"""
import json
import os
import re
from datetime import datetime
from config import Config

def load_json_data(file_path, default=[]):
    """Load data from JSON file"""
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
    return default

def save_json_data(file_path, data):
    """Save data to JSON file"""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {file_path}: {e}")
        return False

# Blog Management
def generate_slug(title):
    """Generate a URL-friendly slug from a title"""
    if not title:
        return 'blog-post'
    
    # Convert to lowercase
    slug = title.lower()
    
    # Replace spaces and multiple spaces with single hyphen
    slug = re.sub(r'\s+', '-', slug)
    
    # Remove all characters except alphanumeric and hyphens
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    # If slug is empty after processing, use default
    if not slug:
        slug = 'blog-post'
    
    return slug

def get_unique_slug(base_slug, existing_blogs, exclude_id=None):
    """Generate a unique slug by appending numbers if needed"""
    slug = base_slug
    counter = 1
    
    while True:
        # Check if slug already exists (excluding current blog if updating)
        exists = any(
            str(blog.get('id')) == slug 
            for blog in existing_blogs 
            if exclude_id is None or str(blog.get('id')) != str(exclude_id)
        )
        
        if not exists:
            return slug
        
        # Append counter to make it unique
        slug = f"{base_slug}-{counter}"
        counter += 1

def get_all_blogs():
    """Get all blogs, sorted by order"""
    blogs = load_json_data(Config.BLOGS_DATA_FILE, default=[])
    # Sort by order field (default to 0 if not set)
    blogs.sort(key=lambda x: x.get('order', 0))
    return blogs

def get_blog_by_id(blog_id):
    """Get a specific blog by ID (works with both numeric IDs and slugs)"""
    blogs = get_all_blogs()
    for blog in blogs:
        if str(blog.get('id')) == str(blog_id):
            return blog
    return None

def add_blog(blog_data):
    """Add a new blog"""
    blogs = get_all_blogs()
    
    # Generate slug ID from English title if not provided
    if 'id' not in blog_data or not blog_data['id']:
        title_en = blog_data.get('titleEn', blog_data.get('title', ''))
        base_slug = generate_slug(title_en)
        blog_data['id'] = get_unique_slug(base_slug, blogs)
    
    # Set order to be last (highest order + 1)
    if 'order' not in blog_data:
        max_order = max([b.get('order', 0) for b in blogs] + [0])
        blog_data['order'] = max_order + 1
    
    # Add timestamp
    blog_data['created_at'] = datetime.now().isoformat()
    blog_data['updated_at'] = datetime.now().isoformat()
    
    blogs.append(blog_data)
    return save_json_data(Config.BLOGS_DATA_FILE, blogs)

def update_blog(blog_id, blog_data):
    """Update an existing blog"""
    blogs = get_all_blogs()
    for i, blog in enumerate(blogs):
        if str(blog.get('id')) == str(blog_id):
            # Check if title changed - if so, regenerate slug
            old_title_en = blog.get('titleEn', '')
            new_title_en = blog_data.get('titleEn', '')
            
            if old_title_en != new_title_en and new_title_en:
                # Title changed, generate new slug
                base_slug = generate_slug(new_title_en)
                blog_data['id'] = get_unique_slug(base_slug, blogs, exclude_id=blog_id)
            else:
                # Keep existing ID
                blog_data['id'] = blog_id
            
            blog_data['created_at'] = blog.get('created_at', datetime.now().isoformat())
            blog_data['updated_at'] = datetime.now().isoformat()
            blogs[i] = blog_data
            return save_json_data(Config.BLOGS_DATA_FILE, blogs)
    return False

def delete_blog(blog_id):
    """Delete a blog"""
    blogs = get_all_blogs()
    blogs = [blog for blog in blogs if str(blog.get('id')) != str(blog_id)]
    return save_json_data(Config.BLOGS_DATA_FILE, blogs)

# Event Management
def get_all_events():
    """Get all events, sorted by order"""
    events = load_json_data(Config.EVENTS_DATA_FILE, default=[])
    # Sort by order field (default to 0 if not set)
    events.sort(key=lambda x: x.get('order', 0))
    return events

def get_event_by_id(event_id):
    """Get a specific event by ID"""
    events = get_all_events()
    for event in events:
        if str(event.get('id')) == str(event_id):
            return event
    return None

def add_event(event_data):
    """Add a new event"""
    events = get_all_events()
    
    # Generate ID if not provided
    if 'id' not in event_data or not event_data['id']:
        max_id = max([int(e.get('id', 0)) for e in events] + [0])
        event_data['id'] = str(max_id + 1)
    
    # Add timestamp
    event_data['created_at'] = datetime.now().isoformat()
    event_data['updated_at'] = datetime.now().isoformat()
    
    events.append(event_data)
    return save_json_data(Config.EVENTS_DATA_FILE, events)

def update_event(event_id, event_data):
    """Update an existing event"""
    events = get_all_events()
    for i, event in enumerate(events):
        if str(event.get('id')) == str(event_id):
            event_data['id'] = event_id
            event_data['created_at'] = event.get('created_at', datetime.now().isoformat())
            event_data['updated_at'] = datetime.now().isoformat()
            events[i] = event_data
            return save_json_data(Config.EVENTS_DATA_FILE, events)
    return False

def delete_event(event_id):
    """Delete an event"""
    events = get_all_events()
    events = [event for event in events if str(event.get('id')) != str(event_id)]
    return save_json_data(Config.EVENTS_DATA_FILE, events)

def update_blog_order(blog_ids):
    """Update the order of blogs based on provided list of IDs"""
    blogs = load_json_data(Config.BLOGS_DATA_FILE, default=[])
    blog_dict = {str(blog.get('id')): blog for blog in blogs}
    
    # Update order for each blog based on its position in the list
    for index, blog_id in enumerate(blog_ids, start=1):
        if str(blog_id) in blog_dict:
            blog_dict[str(blog_id)]['order'] = index
            blog_dict[str(blog_id)]['updated_at'] = datetime.now().isoformat()
    
    return save_json_data(Config.BLOGS_DATA_FILE, blogs)

def update_event_order(event_ids):
    """Update the order of events based on provided list of IDs"""
    events = load_json_data(Config.EVENTS_DATA_FILE, default=[])
    event_dict = {str(event.get('id')): event for event in events}
    
    # Update order for each event based on its position in the list
    for index, event_id in enumerate(event_ids, start=1):
        if str(event_id) in event_dict:
            event_dict[str(event_id)]['order'] = index
            event_dict[str(event_id)]['updated_at'] = datetime.now().isoformat()
    
    return save_json_data(Config.EVENTS_DATA_FILE, events)

def migrate_blog_ids_to_slugs():
    """Migrate existing numeric blog IDs to slug-based IDs"""
    blogs = load_json_data(Config.BLOGS_DATA_FILE, default=[])
    updated = False
    
    for index, blog in enumerate(blogs, start=1):
        current_id = str(blog.get('id', ''))
        
        # Set order if not present
        if 'order' not in blog:
            blog['order'] = index
            updated = True
        
        # Check if ID is numeric (old format)
        if current_id.isdigit():
            # Generate slug from English title
            title_en = blog.get('titleEn', blog.get('title', ''))
            if title_en:
                base_slug = generate_slug(title_en)
                new_id = get_unique_slug(base_slug, blogs, exclude_id=current_id)
                blog['id'] = new_id
                blog['updated_at'] = datetime.now().isoformat()
                updated = True
    
    if updated:
        return save_json_data(Config.BLOGS_DATA_FILE, blogs)
    
    return True

def migrate_event_orders():
    """Set order for existing events that don't have it"""
    events = load_json_data(Config.EVENTS_DATA_FILE, default=[])
    updated = False
    
    for index, event in enumerate(events, start=1):
        if 'order' not in event:
            event['order'] = index
            event['updated_at'] = datetime.now().isoformat()
            updated = True
    
    if updated:
        return save_json_data(Config.EVENTS_DATA_FILE, events)
    
    return True

# Photo Gallery Management
def _ensure_gallery_defaults(gallery):
    """Ensure gallery has derived props like photoCount"""
    photos = gallery.get('photos', [])
    gallery['photoCount'] = len(photos)
    if not gallery.get('coverImage') and photos:
        gallery['coverImage'] = photos[0].get('url')
    return gallery

def get_all_galleries():
    """Get all photo galleries, sorted by order"""
    galleries = load_json_data(Config.PHOTOS_DATA_FILE, default=[])
    galleries.sort(key=lambda x: x.get('order', 0))
    return galleries

def get_gallery_by_id(gallery_id):
    """Fetch a gallery category by ID"""
    galleries = get_all_galleries()
    for gallery in galleries:
        if str(gallery.get('id')) == str(gallery_id):
            return gallery
    return None

def add_gallery(gallery_data):
    """Add a new gallery/category"""
    galleries = get_all_galleries()
    
    if 'id' not in gallery_data or not gallery_data['id']:
        title_en = gallery_data.get('titleEn') or gallery_data.get('title') or 'gallery'
        base_slug = generate_slug(title_en)
        gallery_data['id'] = get_unique_slug(base_slug, galleries)
    
    if 'order' not in gallery_data:
        max_order = max([g.get('order', 0) for g in galleries] + [0])
        gallery_data['order'] = max_order + 1
    
    gallery_data.setdefault('photos', [])
    gallery_data = _ensure_gallery_defaults(gallery_data)
    gallery_data['created_at'] = datetime.now().isoformat()
    gallery_data['updated_at'] = datetime.now().isoformat()
    
    galleries.append(gallery_data)
    return save_json_data(Config.PHOTOS_DATA_FILE, galleries)

def update_gallery(gallery_id, gallery_data):
    """Update an existing gallery/category"""
    galleries = get_all_galleries()
    for i, gallery in enumerate(galleries):
        if str(gallery.get('id')) == str(gallery_id):
            old_title_en = gallery.get('titleEn', '')
            new_title_en = gallery_data.get('titleEn', '')
            
            if old_title_en != new_title_en and new_title_en:
                base_slug = generate_slug(new_title_en)
                gallery_data['id'] = get_unique_slug(base_slug, galleries, exclude_id=gallery_id)
            else:
                gallery_data['id'] = gallery_id
            
            gallery_data.setdefault('photos', [])
            gallery_data = _ensure_gallery_defaults(gallery_data)
            gallery_data['created_at'] = gallery.get('created_at', datetime.now().isoformat())
            gallery_data['updated_at'] = datetime.now().isoformat()
            galleries[i] = gallery_data
            return save_json_data(Config.PHOTOS_DATA_FILE, galleries)
    return False

def delete_gallery(gallery_id):
    """Delete a gallery"""
    galleries = get_all_galleries()
    galleries = [gallery for gallery in galleries if str(gallery.get('id')) != str(gallery_id)]
    return save_json_data(Config.PHOTOS_DATA_FILE, galleries)

def update_gallery_order(gallery_ids):
    """Update gallery ordering"""
    galleries = load_json_data(Config.PHOTOS_DATA_FILE, default=[])
    gallery_dict = {str(gallery.get('id')): gallery for gallery in galleries}
    
    for index, gallery_id in enumerate(gallery_ids, start=1):
        if str(gallery_id) in gallery_dict:
            gallery_dict[str(gallery_id)]['order'] = index
            gallery_dict[str(gallery_id)]['updated_at'] = datetime.now().isoformat()
    
    return save_json_data(Config.PHOTOS_DATA_FILE, galleries)

