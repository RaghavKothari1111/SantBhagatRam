// Photo Gallery JavaScript - Optimized Version
class PhotoGallery {
    constructor() {
        this.currentEvent = null;
        this.currentPhotoIndex = 0;
        this.currentPhotos = [];
        this.eventsData = this.getEventsData();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.generateEventCards();
        this.setupEventListeners();
    }

    // Sample events data
    getEventsData() {
        return [
            {
                id: 'bhajan-evening-2025',
                date: '28 मई 2025',
                title: 'भजन संध्या',
                description: 'श्री रामद्वारा,चित्तौड़गढ़ में आयोजित भजन संध्या',
                coverImage: 'https://via.placeholder.com/400x300/F26096/FFFFFF?text=भजन+संध्या',
                photoCount: 25,
                photos: [
                    'https://via.placeholder.com/600x400/F26096/FFFFFF?text=Photo+1',
                    'https://via.placeholder.com/600x400/F68FB5/FFFFFF?text=Photo+2',
                    'https://via.placeholder.com/600x400/E0759C/FFFFFF?text=Photo+3',
                    'https://via.placeholder.com/600x400/F26096/FFFFFF?text=Photo+4',
                    'https://via.placeholder.com/600x400/F68FB5/FFFFFF?text=Photo+5'
                ]
            },
            {
                id: 'festival-2025',
                date: '26 मई 2025',
                title: 'जापान यात्रा ✈️',
                description: 'पारंपरिक उत्सव के रंगबिरंगे पल और सांस्कृतिक कार्यक्रम',
                coverImage: 'https://via.placeholder.com/400x300/7A4C5B/FFFFFF?text=वार्षिक+उत्सव',
                photoCount: 40,
                photos: [
                    'https://via.placeholder.com/600x400/7A4C5B/FFFFFF?text=Festival+1',
                    'https://via.placeholder.com/600x400/8B5A6B/FFFFFF?text=Festival+2',
                    'https://via.placeholder.com/600x400/9C687B/FFFFFF?text=Festival+3',
                    'https://via.placeholder.com/600x400/7A4C5B/FFFFFF?text=Festival+4'
                ]
            },
            {
                id: 'satsang-2025',
                date: '12 मार्च 2025',
                title: 'सत्संग सभा',
                description: 'आध्यात्मिक चर्चा और भक्ति गीतों का आयोजन',
                coverImage: 'https://via.placeholder.com/400x300/6B4C7A/FFFFFF?text=सत्संग+सभा',
                photoCount: 18,
                photos: [
                    'https://via.placeholder.com/600x400/6B4C7A/FFFFFF?text=Satsang+1',
                    'https://via.placeholder.com/600x400/7B5A8B/FFFFFF?text=Satsang+2',
                    'https://via.placeholder.com/600x400/8B689C/FFFFFF?text=Satsang+3'
                ]
            }
        ];
    }

    generateEventCards() {
        const eventsGrid = document.querySelector('.events-grid');
        if (!eventsGrid) return;

        eventsGrid.innerHTML = '';

        this.eventsData.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-card-image">
                    <img src="${event.coverImage}" alt="${event.title}">
                    <div class="photo-count-badge">${event.photoCount} तस्वीरें</div>
                </div>
                <div class="event-card-content">
                    <div class="event-date">${event.date}</div>
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-description">${event.description}</p>
                    <button class="view-photos-btn" data-event-id="${event.id}">
                        तस्वीरें देखें
                    </button>
                </div>
            `;
            eventsGrid.appendChild(card);
        });
    }

    openEventPhotos(eventId) {
        const event = this.eventsData.find(e => e.id === eventId);
        if (!event) return;

        this.currentEvent = event;
        this.currentPhotos = event.photos;
        this.showPhotoModal();
    }

    showPhotoModal() {
        const modal = document.getElementById('photoModal');
        const modalTitle = document.querySelector('.modal-title h2');
        const modalDate = document.querySelector('.modal-title p');
        const photosGrid = document.querySelector('.photos-grid');

        if (!modal || !this.currentEvent) return;

        modalTitle.textContent = this.currentEvent.title;
        modalDate.textContent = this.currentEvent.date;

        photosGrid.innerHTML = '';
        this.currentPhotos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `<img src="${photo}" alt="Photo ${index + 1}">`;
            photoItem.addEventListener('click', () => this.openLightbox(index));
            photosGrid.appendChild(photoItem);
        });

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    openLightbox(photoIndex) {
        this.currentPhotoIndex = photoIndex;
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        
        if (lightbox && lightboxImg) {
            lightboxImg.src = this.currentPhotos[photoIndex];
            lightbox.classList.add('active');
        }
    }

    closeLightbox() {
        const lightbox = document.getElementById('lightbox');
        if (lightbox) {
            lightbox.classList.remove('active');
        }
    }

    nextPhoto() {
        if (this.currentPhotos.length > 0) {
            this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.currentPhotos.length;
            const lightboxImg = document.getElementById('lightboxImg');
            if (lightboxImg) {
                lightboxImg.src = this.currentPhotos[this.currentPhotoIndex];
            }
        }
    }

    prevPhoto() {
        if (this.currentPhotos.length > 0) {
            this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
            const lightboxImg = document.getElementById('lightboxImg');
            if (lightboxImg) {
                lightboxImg.src = this.currentPhotos[this.currentPhotoIndex];
            }
        }
    }

    setupEventListeners() {
        // Event delegation for view photos buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-photos-btn')) {
                const eventId = e.target.getAttribute('data-event-id');
                this.openEventPhotos(eventId);
            }
            
            // Close modals when clicking outside
            if (e.target.classList.contains('photo-modal')) {
                this.closePhotoModal();
            }
            if (e.target.classList.contains('lightbox')) {
                this.closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const lightbox = document.getElementById('lightbox');
            const modal = document.getElementById('photoModal');
            
            if (lightbox && lightbox.classList.contains('active')) {
                switch(e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.prevPhoto();
                        break;
                    case 'ArrowRight':
                        this.nextPhoto();
                        break;
                }
            } else if (modal && modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closePhotoModal();
                }
            }
        });
    }
}

// Initialize gallery
const gallery = new PhotoGallery();