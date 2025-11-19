import sys
import os
sys.path.append(os.getcwd())
from data_manager import save_json_data
from config import Config
from datetime import datetime

blogs = [
    {
        "id": "community-service-event",
        "title": "The Joy of Giving: Community Service Event",
        "titleEn": "The Joy of Giving: Community Service Event",
        "excerpt": "Our recent food distribution drive brought smiles to hundreds of faces. Join us in our mission to serve humanity.",
        "excerptEn": "Our recent food distribution drive brought smiles to hundreds of faces. Join us in our mission to serve humanity.",
        "content": "Service to humanity is service to God. Last weekend, our volunteers gathered to distribute food and essentials to those in need...",
        "contentEn": "Service to humanity is service to God. Last weekend, our volunteers gathered to distribute food and essentials to those in need...",
        "category": "Service",
        "categoryEn": "Service",
        "date": "18 Nov 2025",
        "dateEn": "18 Nov 2025",
        "image": "/static/uploads/blog_community.png",
        "order": 1,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "annual-festival-highlights",
        "title": "Celebrating Unity: Annual Festival Highlights",
        "titleEn": "Celebrating Unity: Annual Festival Highlights",
        "excerpt": "A vibrant celebration of culture, devotion, and unity. Catch the glimpses of our annual festival.",
        "excerptEn": "A vibrant celebration of culture, devotion, and unity. Catch the glimpses of our annual festival.",
        "content": "The annual festival was a grand success, with thousands of devotees participating in the prayers and festivities...",
        "contentEn": "The annual festival was a grand success, with thousands of devotees participating in the prayers and festivities...",
        "category": "Events",
        "categoryEn": "Events",
        "date": "15 Nov 2025",
        "dateEn": "15 Nov 2025",
        "image": "/static/uploads/blog_festival.png",
        "order": 2,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    },
    {
        "id": "morning-meditation-session",
        "title": "Finding Inner Peace: Morning Meditation",
        "titleEn": "Finding Inner Peace: Morning Meditation",
        "excerpt": "Start your day with mindfulness. Highlights from our daily morning meditation sessions.",
        "excerptEn": "Start your day with mindfulness. Highlights from our daily morning meditation sessions.",
        "content": "Meditation is the key to a peaceful mind. Our morning sessions focus on breath work and mindfulness...",
        "contentEn": "Meditation is the key to a peaceful mind. Our morning sessions focus on breath work and mindfulness...",
        "category": "Spiritual",
        "categoryEn": "Spiritual",
        "date": "10 Nov 2025",
        "dateEn": "10 Nov 2025",
        "image": "/static/images/5.jpg",
        "order": 3,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

if save_json_data(Config.BLOGS_DATA_FILE, blogs):
    print("Successfully populated blogs.")
else:
    print("Failed to populate blogs.")
