"""
Cloudinary integration for file uploads
Falls back to local filesystem if Cloudinary is not configured
"""
import os
import uuid
from werkzeug.utils import secure_filename
from config import Config

class StorageManager:
    """Manages file storage - uses Cloudinary if configured, otherwise local filesystem"""
    
    def __init__(self):
        self.use_cloudinary = (
            Config.USE_CLOUDINARY and 
            Config.CLOUDINARY_CLOUD_NAME and 
            Config.CLOUDINARY_API_KEY and 
            Config.CLOUDINARY_API_SECRET
        )
        
        if self.use_cloudinary:
            try:
                import cloudinary
                import cloudinary.uploader
                
                cloudinary.config(
                    cloud_name=Config.CLOUDINARY_CLOUD_NAME,
                    api_key=Config.CLOUDINARY_API_KEY,
                    api_secret=Config.CLOUDINARY_API_SECRET
                )
                self.cloudinary_uploader = cloudinary.uploader
                print("✓ Cloudinary initialized successfully")
            except ImportError:
                print("⚠ Cloudinary package not installed, falling back to local storage")
                self.use_cloudinary = False
            except Exception as e:
                print(f"⚠ Error initializing Cloudinary: {e}")
                self.use_cloudinary = False
        else:
            print("ℹ Using local filesystem storage")
    
    def save_file(self, file, folder='uploads'):
        """
        Save uploaded file to Cloudinary or local filesystem
        Args:
            file: FileStorage object from Flask request
            folder: Folder name in Cloudinary (or local directory)
        Returns:
            URL path to the file (Cloudinary URL or local path)
        """
        if not file or not file.filename:
            return None
        
        if self.use_cloudinary:
            try:
                # Reset file pointer to beginning
                file.seek(0)
                
                # Upload to Cloudinary
                result = self.cloudinary_uploader.upload(
                    file,
                    folder=folder,
                    resource_type="auto",  # auto-detect image/video/raw
                    use_filename=True,
                    unique_filename=True
                )
                
                # Return secure HTTPS URL
                return result.get('secure_url') or result.get('url')
            except Exception as e:
                print(f"Error uploading to Cloudinary: {e}")
                # Fallback to local storage
                return self._save_local(file)
        else:
            return self._save_local(file)
    
    def _save_local(self, file):
        """Save file to local filesystem (fallback)"""
        try:
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
            filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.seek(0)  # Reset file pointer
            file.save(filepath)
            return f"/static/uploads/{unique_filename}"
        except Exception as e:
            print(f"Error saving file locally: {e}")
            return None
    
    def delete_file(self, file_url):
        """
        Delete file from Cloudinary or local filesystem
        Args:
            file_url: Full URL (Cloudinary) or path (local)
        """
        if self.use_cloudinary and 'cloudinary.com' in file_url:
            try:
                # Extract public_id from Cloudinary URL
                # URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
                # or: https://res.cloudinary.com/cloud_name/image/upload/folder/filename.jpg
                
                # Split by /upload/
                parts = file_url.split('/upload/')
                if len(parts) > 1:
                    # Get everything after /upload/
                    path_part = parts[1]
                    
                    # Remove version if present (v1234567890/)
                    if path_part.startswith('v') and '/' in path_part:
                        path_part = '/'.join(path_part.split('/')[1:])
                    
                    # Remove file extension and query params
                    public_id = path_part.split('.')[0].split('?')[0]
                    
                    # Delete from Cloudinary
                    result = self.cloudinary_uploader.destroy(public_id)
                    if result.get('result') == 'ok':
                        print(f"✓ Deleted from Cloudinary: {public_id}")
                    else:
                        print(f"⚠ Cloudinary deletion result: {result.get('result')}")
            except Exception as e:
                print(f"Error deleting from Cloudinary: {e}")
        else:
            # Delete from local filesystem
            try:
                # Extract filename from URL/path
                if file_url.startswith('/static/uploads/'):
                    filename = file_url.replace('/static/uploads/', '')
                else:
                    filename = os.path.basename(file_url.split('?')[0])  # Remove query params
                
                filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
                if os.path.exists(filepath):
                    os.remove(filepath)
                    print(f"✓ Deleted local file: {filepath}")
            except Exception as e:
                print(f"Error deleting local file: {e}")

# Create global instance
storage_manager = StorageManager()

