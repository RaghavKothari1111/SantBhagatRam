#!/usr/bin/env python3
"""
Image Compression Script
Compresses all images in static/images and static/uploads directories.
Reduces file sizes while maintaining visual quality.
"""
import os
from pathlib import Path

# Try to import Pillow; if unavailable, inform the user.
try:
    from PIL import Image
except ImportError:
    print("Pillow library is not installed. Please install it in a virtual environment: \n    python3 -m venv venv && source venv/bin/activate && pip install Pillow\nThen run this script again.")
    exit(1)

def compress_image(input_path, quality=85, max_width=1920):
    """Compress an image file.
    Args:
        input_path (str): Path to the image file.
        quality (int): JPEG quality (1-100).
        max_width (int): Maximum width in pixels.
    """
    try:
        img = Image.open(input_path)
        orig_size = os.path.getsize(input_path)
        # Resize if wider than max_width
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        # Convert to RGB for JPEG output
        if img.mode != "RGB":
            img = img.convert("RGB")
        # Save compressed version
        output_path = str(Path(input_path).with_suffix('.jpg'))
        img.save(output_path, "JPEG", quality=quality, optimize=True)
        new_size = os.path.getsize(output_path)
        reduction = (orig_size - new_size) / orig_size * 100
        print(f"Compressed {input_path} → {output_path} ({reduction:.1f}% smaller)")
        # Replace original if different extension
        if input_path != output_path:
            os.remove(input_path)
    except Exception as e:
        print(f"Error compressing {input_path}: {e}")

def compress_directory(dir_path):
    """Compress all images in a directory."""
    if not os.path.isdir(dir_path):
        print(f"Directory {dir_path} does not exist.")
        return
    exts = ('.jpg', '.jpeg', '.png', '.webp')
    for root, _, files in os.walk(dir_path):
        for f in files:
            if f.lower().endswith(exts):
                compress_image(os.path.join(root, f))

if __name__ == "__main__":
    compress_directory('static/images')
    compress_directory('static/uploads')
    print("Image compression completed.")
