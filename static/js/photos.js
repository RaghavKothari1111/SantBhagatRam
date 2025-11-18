// Photo Gallery JavaScript
class PhotoGallery {
    constructor() {
        this.currentEvent = null;
        this.currentPhotoIndex = 0;
        this.currentPhotos = [];
        this.eventsData = Array.isArray(window.galleryData) ? window.galleryData : [];
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.setupEventListeners();
    }

    getCurrentLanguage() {
        return window.getCurrentLanguage ? window.getCurrentLanguage() : 'hi';
    }

    findEvent(eventId) {
        return this.eventsData.find(event => String(event.id) === String(eventId));
    }

    openEventPhotos(eventId) {
        if (!eventId) {
            console.warn('No event ID provided');
            return;
        }
        
        const event = this.findEvent(eventId);
        if (!event) {
            console.warn('Gallery not found for ID:', eventId, 'Available IDs:', this.eventsData.map(g => g.id));
            return;
        }

        this.currentEvent = event;
        this.currentPhotos = Array.isArray(event.photos) ? event.photos : [];
        this.showPhotoModal();
    }

    showPhotoModal() {
        const modal = document.getElementById('photoModal');
        const modalTitle = document.querySelector('.modal-title h2');
        const modalDate = document.querySelector('.modal-title p');
        const photosGrid = document.querySelector('.photos-grid');

        if (!modal || !this.currentEvent) return;

        const lang = this.getCurrentLanguage();
        const title = lang === 'en'
            ? (this.currentEvent.titleEn || this.currentEvent.title)
            : (this.currentEvent.title || this.currentEvent.titleEn);
        const date = lang === 'en'
            ? (this.currentEvent.dateEn || this.currentEvent.date)
            : (this.currentEvent.date || this.currentEvent.dateEn);

        modalTitle.textContent = title || '';
        modalDate.textContent = date || '';

        photosGrid.innerHTML = '';
        if (!this.currentPhotos.length) {
            const noPhotos = document.createElement('p');
            noPhotos.className = 'no-photos-message';
            noPhotos.setAttribute('data-lang-photos', 'noPhotos');
            noPhotos.textContent = 'जल्द ही तस्वीरें जोड़ी जाएंगी।';
            photosGrid.appendChild(noPhotos);
        } else {
            this.currentPhotos.forEach((photo, index) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                const captionText = lang === 'en'
                    ? (photo.captionEn || photo.caption || '')
                    : (photo.caption || photo.captionEn || '');
                photoItem.innerHTML = `<img src="${photo.url}" alt="${captionText || `Photo ${index + 1}`}" loading="lazy">`;
                photoItem.addEventListener('click', () => this.openLightbox(index));
                photosGrid.appendChild(photoItem);
            });
        }

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
        if (!this.currentPhotos.length) return;
        this.currentPhotoIndex = photoIndex;
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightboxImg');
        
        if (lightbox && lightboxImg) {
            lightboxImg.src = this.currentPhotos[photoIndex].url;
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
                lightboxImg.src = this.currentPhotos[this.currentPhotoIndex].url;
            }
        }
    }

    prevPhoto() {
        if (this.currentPhotos.length > 0) {
            this.currentPhotoIndex = (this.currentPhotoIndex - 1 + this.currentPhotos.length) % this.currentPhotos.length;
            const lightboxImg = document.getElementById('lightboxImg');
            if (lightboxImg) {
                lightboxImg.src = this.currentPhotos[this.currentPhotoIndex].url;
            }
        }
    }

    setupEventListeners() {
        // Use event delegation for view photos buttons
        document.addEventListener('click', (e) => {
            // Check if click is on or inside a view-photos-btn
            const viewBtn = e.target.closest('.view-photos-btn');
            if (viewBtn) {
                e.preventDefault();
                e.stopPropagation();
                const eventId = viewBtn.getAttribute('data-event-id');
                if (eventId) {
                    this.openEventPhotos(eventId);
                }
                return;
            }
            
            // Close modals when clicking outside
            if (e.target.classList.contains('photo-modal')) {
                this.closePhotoModal();
            }
            if (e.target.classList.contains('lightbox')) {
                this.closeLightbox();
            }
        });
        
        // Also attach direct event listeners to buttons as fallback
        setTimeout(() => {
            const viewButtons = document.querySelectorAll('.view-photos-btn');
            viewButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const eventId = btn.getAttribute('data-event-id');
                    if (eventId) {
                        this.openEventPhotos(eventId);
                    }
                });
            });
        }, 100);

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

        window.addEventListener('languageChanged', () => {
            const modal = document.getElementById('photoModal');
            if (modal && modal.classList.contains('active')) {
                this.showPhotoModal();
            }
        });
    }
}

// Initialize gallery
window.gallery = new PhotoGallery();