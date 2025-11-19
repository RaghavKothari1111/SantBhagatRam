"""
Image utility functions for responsive images and Cloudinary transformations
"""
import re
from storage import storage_manager

def is_cloudinary_url(url):
    """Check if URL is from Cloudinary"""
    if not url:
        return False
    return 'cloudinary.com' in url or 'res.cloudinary.com' in url

def get_responsive_image_url(url, width=None, quality='auto', format='auto'):
    """
    Generate responsive image URL with Cloudinary transformations
    Args:
        url: Original image URL
        width: Desired width (None for auto)
        quality: Image quality ('auto', 'best', 'good', 'eco', 'low', or number 1-100)
        format: Image format ('auto', 'webp', 'avif', 'jpg', 'png', etc.)
    Returns:
        Transformed URL
    """
    if not url:
        return url
    
    # If not Cloudinary, return original URL
    if not is_cloudinary_url(url):
        return url
    
    # Parse Cloudinary URL
    # Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    # or: https://res.cloudinary.com/cloud_name/image/upload/folder/filename.jpg
    
    # Split by /upload/ to find where to insert transformations
    if '/upload/' in url:
        parts = url.split('/upload/')
        if len(parts) == 2:
            base_url = parts[0] + '/upload/'
            path_part = parts[1]
            
            # Check if transformations already exist (they would be before the path)
            # If path_part starts with a transformation pattern, we need to replace it
            # Otherwise, insert new transformations
            
            # Build transformation string
            transformations = []
            
            if format and format != 'none':
                transformations.append(f'f_{format}')
            
            if quality:
                transformations.append(f'q_{quality}')
            
            if width:
                transformations.append(f'w_{width}')
            
            # Add DPR auto for retina displays
            transformations.append('dpr_auto')
            
            # Add auto crop and gravity for better quality
            transformations.append('c_auto,g_auto')
            
            if transformations:
                transform_str = ','.join(transformations)
                # Insert transformations before the path
                return f"{base_url}{transform_str}/{path_part}"
    
    return url

def generate_srcset(url, widths=None):
    """
    Generate srcset string for responsive images
    Args:
        url: Original image URL
        widths: List of widths (default: [400, 800, 1200, 1600, 2000])
    Returns:
        srcset string like "url1 400w, url2 800w, ..."
    """
    if not url:
        return ''
    
    if widths is None:
        widths = [400, 800, 1200, 1600, 2000]
    
    srcset_parts = []
    for width in widths:
        responsive_url = get_responsive_image_url(url, width=width, quality='auto', format='auto')
        srcset_parts.append(f"{responsive_url} {width}w")
    
    return ', '.join(srcset_parts)

def generate_responsive_image_attrs(url, sizes=None, default_width=1200):
    """
    Generate complete responsive image attributes
    Args:
        url: Original image URL
        sizes: sizes attribute string (default: responsive sizes)
        default_width: Default width for src attribute
    Returns:
        Dictionary with src, srcset, sizes attributes
    """
    if not url:
        return {'src': '', 'srcset': '', 'sizes': ''}
    
    # Default sizes for responsive images
    if sizes is None:
        sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 400px"
    
    # Generate srcset
    srcset = generate_srcset(url)
    
    # Generate default src with optimizations
    src = get_responsive_image_url(url, width=default_width, quality='auto', format='auto')
    
    return {
        'src': src,
        'srcset': srcset,
        'sizes': sizes
    }

