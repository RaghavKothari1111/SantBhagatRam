"""
Data management utilities for blogs, events, and photo galleries.
Handles reading/writing JSON data files.
Uses Cloudinary for persistent storage if configured, otherwise uses local filesystem.
"""
import json
import os
import re
import uuid
from datetime import datetime, timedelta
from config import Config
import requests
import xml.etree.ElementTree as ET

# Import storage manager for Cloudinary support
try:
    from storage import storage_manager
    USE_STORAGE_MANAGER = True
except ImportError:
    USE_STORAGE_MANAGER = False
    storage_manager = None

def _get_filename_from_path(file_path):
    """Extract filename from full path"""
    return os.path.basename(file_path)

def load_json_data(file_path, default=[]):
    """Load data from JSON file (Cloudinary or local)"""
    filename = _get_filename_from_path(file_path)
    
    if USE_STORAGE_MANAGER and storage_manager:
        # Use storage manager (supports Cloudinary)
        return storage_manager.load_json_data(filename, default=default)
    else:
        # Fallback to local filesystem
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
        return default

def save_json_data(file_path, data):
    """Save data to JSON file (Cloudinary or local)"""
    filename = _get_filename_from_path(file_path)
    
    if USE_STORAGE_MANAGER and storage_manager:
        # Use storage manager (supports Cloudinary)
        return storage_manager.save_json_data(filename, data)
    else:
        # Fallback to local filesystem
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

# Slider Management
def get_all_slider_images():
    """Get all slider images, sorted by order"""
    images = load_json_data(Config.SLIDER_DATA_FILE, default=[])
    images.sort(key=lambda x: x.get('order', 0))
    return images

def get_slider_image_by_id(image_id):
    """Fetch a slider image by ID"""
    images = get_all_slider_images()
    for image in images:
        if str(image.get('id')) == str(image_id):
            return image
    return None

def add_slider_image(image_data):
    """Add a new slider image"""
    images = get_all_slider_images()
    
    if 'id' not in image_data or not image_data['id']:
        image_data['id'] = str(uuid.uuid4())[:8]
    
    if 'order' not in image_data:
        max_order = max([img.get('order', 0) for img in images] + [0])
        image_data['order'] = max_order + 1
    
    image_data['created_at'] = datetime.now().isoformat()
    image_data['updated_at'] = datetime.now().isoformat()
    
    images.append(image_data)
    return save_json_data(Config.SLIDER_DATA_FILE, images)

def update_slider_image(image_id, image_data):
    """Update an existing slider image"""
    images = get_all_slider_images()
    for i, image in enumerate(images):
        if str(image.get('id')) == str(image_id):
            image_data['id'] = image_id
            image_data['order'] = image.get('order', image_data.get('order', 0))
            image_data['created_at'] = image.get('created_at', datetime.now().isoformat())
            image_data['updated_at'] = datetime.now().isoformat()
            images[i] = image_data
            return save_json_data(Config.SLIDER_DATA_FILE, images)
    return False

def delete_slider_image(image_id):
    """Delete a slider image"""
    images = get_all_slider_images()
    images = [img for img in images if str(img.get('id')) != str(image_id)]
    return save_json_data(Config.SLIDER_DATA_FILE, images)

def update_slider_order(image_ids):
    """Update slider image ordering"""
    images = load_json_data(Config.SLIDER_DATA_FILE, default=[])
    image_dict = {str(img.get('id')): img for img in images}
    
    for index, image_id in enumerate(image_ids, start=1):
        if str(image_id) in image_dict:
            image_dict[str(image_id)]['order'] = index
            image_dict[str(image_id)]['updated_at'] = datetime.now().isoformat()
    
    return save_json_data(Config.SLIDER_DATA_FILE, images)

# Videos Dropdown Management
def get_videos_dropdown_data():
    """Get videos dropdown data"""
    default_data = {
        'categories': [],
        'links': [],
        'social_media': {
            'youtube': 'https://www.youtube.com/@Santdigvijayramji/',
            'instagram': 'https://www.instagram.com/santdigvijayramji/?hl=en'
        }
    }
    data = load_json_data(Config.VIDEOS_DROPDOWN_DATA_FILE, default=default_data)
    
    # Ensure social_media exists
    if 'social_media' not in data:
        data['social_media'] = default_data['social_media']
    
    # Sort categories and links by order
    if 'categories' in data:
        data['categories'].sort(key=lambda x: x.get('order', 0))
    if 'links' in data:
        data['links'].sort(key=lambda x: x.get('order', 0))
    
    return data

def save_videos_dropdown_data(data):
    """Save videos dropdown data"""
    return save_json_data(Config.VIDEOS_DROPDOWN_DATA_FILE, data)

def add_video_category(category_data):
    """Add a new video category"""
    data = get_videos_dropdown_data()
    if 'categories' not in data:
        data['categories'] = []
    
    category_id = str(uuid.uuid4())[:8]
    category_data['id'] = category_id
    category_data['order'] = category_data.get('order', len(data['categories']) + 1)
    category_data['created_at'] = datetime.now().isoformat()
    category_data['font_size'] = category_data.get('font_size', 'large')
    
    data['categories'].append(category_data)
    return save_videos_dropdown_data(data), category_id

def update_video_category(category_id, category_data):
    """Update a video category"""
    data = get_videos_dropdown_data()
    if 'categories' not in data:
        return False
    
    for i, cat in enumerate(data['categories']):
        if str(cat.get('id')) == str(category_id):
            category_data['id'] = category_id
            category_data['order'] = cat.get('order', i + 1)
            category_data['updated_at'] = datetime.now().isoformat()
            if 'created_at' in cat:
                category_data['created_at'] = cat['created_at']
            category_data['font_size'] = category_data.get('font_size', 'large')
            data['categories'][i] = category_data
            return save_videos_dropdown_data(data)
    return False

def delete_video_category(category_id):
    """Delete a video category"""
    data = get_videos_dropdown_data()
    if 'categories' not in data:
        return False
    
    data['categories'] = [cat for cat in data['categories'] if str(cat.get('id')) != str(category_id)]
    return save_videos_dropdown_data(data)

def add_video_link(link_data):
    """Add a new video link"""
    data = get_videos_dropdown_data()
    if 'links' not in data:
        data['links'] = []
    
    link_id = str(uuid.uuid4())[:8]
    link_data['id'] = link_id
    link_data['order'] = link_data.get('order', len(data['links']) + 1)
    link_data['created_at'] = datetime.now().isoformat()
    link_data['font_size'] = link_data.get('font_size', 'small')
    
    data['links'].append(link_data)
    return save_videos_dropdown_data(data), link_id

def update_video_link(link_id, link_data):
    """Update a video link"""
    data = get_videos_dropdown_data()
    if 'links' not in data:
        return False
    
    for i, link in enumerate(data['links']):
        if str(link.get('id')) == str(link_id):
            link_data['id'] = link_id
            link_data['order'] = link.get('order', i + 1)
            link_data['updated_at'] = datetime.now().isoformat()
            if 'created_at' in link:
                link_data['created_at'] = link['created_at']
            link_data['font_size'] = link_data.get('font_size', 'small')
            data['links'][i] = link_data
            return save_videos_dropdown_data(data)
    return False

def delete_video_link(link_id):
    """Delete a video link"""
    data = get_videos_dropdown_data()
    if 'links' not in data:
        return False
    
    data['links'] = [link for link in data['links'] if str(link.get('id')) != str(link_id)]
    return save_videos_dropdown_data(data)

def update_video_order(item_type, item_ids):
    """Update video dropdown item ordering (categories or links)"""
    data = get_videos_dropdown_data()
    key = 'categories' if item_type == 'category' else 'links'
    
    if key not in data:
        data[key] = []
    
    item_dict = {str(item.get('id')): item for item in data[key]}
    
    for index, item_id in enumerate(item_ids, start=1):
        if str(item_id) in item_dict:
            item_dict[str(item_id)]['order'] = index
            item_dict[str(item_id)]['updated_at'] = datetime.now().isoformat()
    
    data[key] = list(item_dict.values())
    return save_videos_dropdown_data(data)

def update_social_media(social_data):
    """Update social media links"""
    data = get_videos_dropdown_data()
    data['social_media'] = social_data
    return save_videos_dropdown_data(data)

# Generic Navbar Dropdowns Management
def get_navbar_dropdowns_data():
    """Get all navbar dropdowns data"""
    default_data = {
        'social_media': {
            'youtube': 'https://www.youtube.com/@Santdigvijayramji/',
            'instagram': 'https://www.instagram.com/santdigvijayramji/?hl=en'
        },
        'dropdowns': {
            'projects': {'enabled': True, 'columns': []},
            'videos': {'enabled': True, 'columns': []},
            'blog': {'enabled': False, 'columns': []},
            'photos': {'enabled': False, 'columns': []},
            'events': {'enabled': False, 'columns': []}
        }
    }
    data = load_json_data(Config.NAVBAR_DROPDOWNS_DATA_FILE, default=default_data)
    
    # Ensure structure exists
    if 'social_media' not in data:
        data['social_media'] = default_data['social_media']
    if 'dropdowns' not in data:
        data['dropdowns'] = default_data['dropdowns']
    
    # Sort columns by order and items within each column by order
    for nav_item, dropdown_data in data.get('dropdowns', {}).items():
        if 'columns' in dropdown_data:
            # Sort columns by order
            dropdown_data['columns'].sort(key=lambda x: x.get('order', 0))
            # Sort items in each column by order
            for column in dropdown_data['columns']:
                if 'items' in column:
                    column['items'].sort(key=lambda x: x.get('order', 0))
    
    return data

def save_navbar_dropdowns_data(data):
    """Save navbar dropdowns data"""
    return save_json_data(Config.NAVBAR_DROPDOWNS_DATA_FILE, data)

def get_dropdown_for_nav_item(nav_item):
    """Get dropdown data for a specific navbar item"""
    data = get_navbar_dropdowns_data()
    return data.get('dropdowns', {}).get(nav_item, {'enabled': False, 'columns': []})

def update_dropdown_for_nav_item(nav_item, dropdown_data):
    """Update dropdown data for a specific navbar item"""
    data = get_navbar_dropdowns_data()
    if 'dropdowns' not in data:
        data['dropdowns'] = {}
    data['dropdowns'][nav_item] = dropdown_data
    return save_navbar_dropdowns_data(data)

def toggle_dropdown_enabled(nav_item, enabled):
    """Enable or disable dropdown for a navbar item"""
    data = get_navbar_dropdowns_data()
    if 'dropdowns' not in data:
        data['dropdowns'] = {}
    if nav_item not in data['dropdowns']:
        data['dropdowns'][nav_item] = {'enabled': False, 'columns': []}
    data['dropdowns'][nav_item]['enabled'] = enabled
    return save_navbar_dropdowns_data(data)

def add_dropdown_column(nav_item, column_data):
    """Add a column to a dropdown"""
    data = get_navbar_dropdowns_data()
    if 'dropdowns' not in data:
        data['dropdowns'] = {}
    if nav_item not in data['dropdowns']:
        data['dropdowns'][nav_item] = {'enabled': True, 'columns': []}
    
    column_id = str(uuid.uuid4())[:8]
    column_data['id'] = column_id
    column_data['order'] = column_data.get('order', len(data['dropdowns'][nav_item]['columns']) + 1)
    if 'items' not in column_data:
        column_data['items'] = []
    
    data['dropdowns'][nav_item]['columns'].append(column_data)
    return save_navbar_dropdowns_data(data), column_id

def update_dropdown_column(nav_item, column_id, column_data):
    """Update a dropdown column"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False
    
    for i, col in enumerate(data['dropdowns'][nav_item]['columns']):
        if str(col.get('id')) == str(column_id):
            column_data['id'] = column_id
            column_data['order'] = col.get('order', i + 1)
            if 'items' not in column_data:
                column_data['items'] = col.get('items', [])
            data['dropdowns'][nav_item]['columns'][i] = column_data
            return save_navbar_dropdowns_data(data)
    return False

def delete_dropdown_column(nav_item, column_id):
    """Delete a dropdown column"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False
    
    data['dropdowns'][nav_item]['columns'] = [
        col for col in data['dropdowns'][nav_item]['columns'] 
        if str(col.get('id')) != str(column_id)
    ]
    return save_navbar_dropdowns_data(data)

def add_dropdown_item(nav_item, column_id, item_data):
    """Add an item to a dropdown column"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False, None
    
    for col in data['dropdowns'][nav_item]['columns']:
        if str(col.get('id')) == str(column_id):
            if 'items' not in col:
                col['items'] = []
            
            item_id = str(uuid.uuid4())[:8]
            item_data['id'] = item_id
            item_data['order'] = item_data.get('order', len(col['items']) + 1)
            item_data['font_size'] = item_data.get('font_size', 'small')
            
            col['items'].append(item_data)
            return save_navbar_dropdowns_data(data), item_id
    return False, None

def update_dropdown_item(nav_item, column_id, item_id, item_data):
    """Update an item in a dropdown column"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False
    
    for col in data['dropdowns'][nav_item]['columns']:
        if str(col.get('id')) == str(column_id):
            if 'items' not in col:
                return False
            
            for i, item in enumerate(col['items']):
                if str(item.get('id')) == str(item_id):
                    item_data['id'] = item_id
                    item_data['order'] = item.get('order', i + 1)
                    item_data['font_size'] = item_data.get('font_size', 'small')
                    col['items'][i] = item_data
                    return save_navbar_dropdowns_data(data)
    return False

def delete_dropdown_item(nav_item, column_id, item_id):
    """Delete an item from a dropdown column"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False
    
    for col in data['dropdowns'][nav_item]['columns']:
        if str(col.get('id')) == str(column_id):
            if 'items' not in col:
                return False
            col['items'] = [
                item for item in col['items'] 
                if str(item.get('id')) != str(item_id)
            ]
            return save_navbar_dropdowns_data(data)
    return False

def update_dropdown_column_order(nav_item, column_ids):
    """Update column order for a dropdown"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False
    
    column_dict = {str(col.get('id')): col for col in data['dropdowns'][nav_item]['columns']}
    
    for index, col_id in enumerate(column_ids, start=1):
        if str(col_id) in column_dict:
            column_dict[str(col_id)]['order'] = index
    
    data['dropdowns'][nav_item]['columns'] = list(column_dict.values())
    return save_navbar_dropdowns_data(data)

def update_dropdown_item_order(nav_item, column_id, item_ids):
    """Update item order within a column"""
    data = get_navbar_dropdowns_data()
    if nav_item not in data.get('dropdowns', {}):
        return False
    
    for col in data['dropdowns'][nav_item]['columns']:
        if str(col.get('id')) == str(column_id):
            if 'items' not in col:
                return False
            
            item_dict = {str(item.get('id')): item for item in col['items']}
            
            for index, item_id in enumerate(item_ids, start=1):
                if str(item_id) in item_dict:
                    item_dict[str(item_id)]['order'] = index
            
            col['items'] = list(item_dict.values())
            return save_navbar_dropdowns_data(data)
    return False

def update_global_social_media(social_data):
    """Update global social media links (used in all dropdowns)"""
    data = get_navbar_dropdowns_data()
    data['social_media'] = social_data
    return save_navbar_dropdowns_data(data)

# Objectives Management
def get_all_objectives():
    """Get all objectives, sorted by order"""
    objectives = load_json_data(Config.OBJECTIVES_DATA_FILE, default=[])
    # Sort by order field (default to 0 if not set)
    objectives.sort(key=lambda x: x.get('order', 0))
    return objectives

def get_objective_by_id(objective_id):
    """Get a specific objective by ID"""
    objectives = get_all_objectives()
    for objective in objectives:
        if str(objective.get('id')) == str(objective_id):
            return objective
    return None

def add_objective(objective_data):
    """Add a new objective"""
    objectives = get_all_objectives()
    
    # Generate ID if not provided
    if 'id' not in objective_data or not objective_data['id']:
        objective_data['id'] = str(uuid.uuid4())[:8]
    
    # Set order to be last (highest order + 1)
    if 'order' not in objective_data:
        max_order = max([obj.get('order', 0) for obj in objectives] + [0])
        objective_data['order'] = max_order + 1
    
    # Add timestamp
    objective_data['created_at'] = datetime.now().isoformat()
    objective_data['updated_at'] = datetime.now().isoformat()
    
    objectives.append(objective_data)
    return save_json_data(Config.OBJECTIVES_DATA_FILE, objectives)

def update_objective(objective_id, objective_data):
    """Update an existing objective"""
    objectives = get_all_objectives()
    for i, objective in enumerate(objectives):
        if str(objective.get('id')) == str(objective_id):
            objective_data['id'] = objective_id
            objective_data['order'] = objective.get('order', objective_data.get('order', 0))
            objective_data['created_at'] = objective.get('created_at', datetime.now().isoformat())
            objective_data['updated_at'] = datetime.now().isoformat()
            objectives[i] = objective_data
            return save_json_data(Config.OBJECTIVES_DATA_FILE, objectives)
    return False

def delete_objective(objective_id):
    """Delete an objective"""
    objectives = get_all_objectives()
    objectives = [obj for obj in objectives if str(obj.get('id')) != str(objective_id)]
    return save_json_data(Config.OBJECTIVES_DATA_FILE, objectives)

def update_objective_order(objective_ids):
    """Update the order of objectives based on provided list of IDs"""
    objectives = load_json_data(Config.OBJECTIVES_DATA_FILE, default=[])
    objective_dict = {str(obj.get('id')): obj for obj in objectives}
    
    # Update order for each objective based on its position in the list
    for index, objective_id in enumerate(objective_ids, start=1):
        if str(objective_id) in objective_dict:
            objective_dict[str(objective_id)]['order'] = index
            objective_dict[str(objective_id)]['updated_at'] = datetime.now().isoformat()
    
    return save_json_data(Config.OBJECTIVES_DATA_FILE, objectives)


def get_latest_youtube_videos(limit=50):
    """Fetch latest videos from YouTube RSS feed"""
    CHANNEL_ID = "UC6xKFvHyM3KRmaq9grhYz3g"
    RSS_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
    CACHE_FILE = os.path.join(os.path.dirname(Config.BLOGS_DATA_FILE), 'youtube_cache.json')
    
    # Check cache
    cached_data = load_json_data(CACHE_FILE, default=None)
    if cached_data:
        last_updated = cached_data.get('last_updated')
        if last_updated:
            try:
                last_updated_time = datetime.fromisoformat(last_updated)
                if datetime.now() - last_updated_time < timedelta(hours=1):
                    return cached_data.get('videos', [])[:limit]
            except ValueError:
                pass # Invalid date format, ignore cache

    try:
        response = requests.get(RSS_URL, timeout=5)
        if response.status_code == 200:
            root = ET.fromstring(response.content)
            ns = {'yt': 'http://www.youtube.com/xml/schemas/2015', 'media': 'http://search.yahoo.com/mrss/', 'atom': 'http://www.w3.org/2005/Atom'}
            
            videos = []
            for entry in root.findall('atom:entry', ns):
                video_id = entry.find('yt:videoId', ns).text
                title = entry.find('atom:title', ns).text
                published = entry.find('atom:published', ns).text
                
                # Parse published date
                try:
                    pub_date = datetime.fromisoformat(published.replace('Z', '+00:00'))
                    days_ago = (datetime.now(pub_date.tzinfo) - pub_date).days
                except:
                    days_ago = 0
                
                if days_ago == 0:
                    date_str = "Today"
                elif days_ago == 1:
                    date_str = "1 day ago"
                else:
                    date_str = f"{days_ago} days ago"
                
                media_group = entry.find('media:group', ns)
                thumbnail = media_group.find('media:thumbnail', ns).attrib['url']
                description = media_group.find('media:description', ns).text or ""
                
                # Determine category
                category = 'video'
                if 'LIVE' in title.upper() or 'STREAM' in title.upper():
                    category = 'livestream'
                
                videos.append({
                    'id': video_id,
                    'title': title,
                    'date': f"YouTube • {date_str}",
                    'description': description[:150] + "..." if len(description) > 150 else description,
                    'thumbnail': thumbnail,
                    'url': f"https://www.youtube.com/embed/{video_id}",
                    'watch_url': f"https://www.youtube.com/watch?v={video_id}",
                    'category': category
                })
            
            # Save to cache
            cache_data = {
                'last_updated': datetime.now().isoformat(),
                'videos': videos
            }
            save_json_data(CACHE_FILE, cache_data)
            
            return videos[:limit]
            
    except Exception as e:
        print(f"Error fetching YouTube videos: {e}")
        if cached_data:
            return cached_data.get('videos', [])[:limit]
            
    return []
