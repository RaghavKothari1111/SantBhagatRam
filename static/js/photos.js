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
        this.setupUrlHandling();
        
        // Check if there's an initial gallery ID from URL or server
        const galleryId = this.getGalleryIdFromUrl() || window.initialGalleryId;
        if (galleryId) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.openEventPhotos(galleryId);
            }, 100);
        }
    }

    getCurrentLanguage() {
        return window.getCurrentLanguage ? window.getCurrentLanguage() : 'hi';
    }

    findEvent(eventId) {
        return this.eventsData.find(event => String(event.id) === String(eventId));
    }

    // URL Helper Functions
    getGalleryIdFromUrl() {
        const path = window.location.pathname;
        const match = path.match(/^\/photos\/(.+)$/);
        return match ? match[1] : null;
    }

    updateUrlForGallery(galleryId) {
        const newUrl = `/photos/${galleryId}`;
        if (window.location.pathname !== newUrl) {
            window.history.pushState({ galleryId: galleryId }, '', newUrl);
        }
    }

    updateUrlForPhotosList() {
        if (window.location.pathname !== '/photos') {
            window.history.pushState({}, '', '/photos');
        }
    }

    setupUrlHandling() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const galleryId = this.getGalleryIdFromUrl();
            const modal = document.getElementById('photoModal');
            const isModalOpen = modal && modal.classList.contains('active');
            
            if (galleryId) {
                // URL has gallery ID, open that gallery
                if (!isModalOpen || String(this.currentEvent?.id) !== String(galleryId)) {
                    // Don't update URL again since we're already at the correct URL
                    const event = this.findEvent(galleryId);
                    if (event) {
                        this.currentEvent = event;
                        this.currentPhotos = Array.isArray(event.photos) ? event.photos : [];
                        this.showPhotoModal();
                    }
                }
            } else {
                // URL doesn't have gallery ID, close modal if open
                if (isModalOpen) {
                    const modal = document.getElementById('photoModal');
                    if (modal) {
                        const photosGrid = document.querySelector('.photos-grid');
                        if (photosGrid) {
                            photosGrid.style.display = '';
                            photosGrid.style.gridTemplateColumns = '';
                            photosGrid.style.gap = '';
                        }
                        
                        modal.classList.remove('active');
                        document.body.style.overflow = 'auto';
                        // Don't call updateUrlForPhotosList() here since URL is already correct
                    }
                }
            }
        });
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
        
        // Update URL to include gallery ID
        this.updateUrlForGallery(eventId);
        
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
            console.log('Loading photos:', this.currentPhotos.length, 'photos');
            
            // Prepare items for grid
            const gridItems = this.currentPhotos.map((photo, index) => {
                const captionText = lang === 'en'
                    ? (photo.captionEn || photo.caption || '')
                    : (photo.caption || photo.captionEn || '');
                
                return {
                    id: `photo-${index}`,
                    url: photo.url,
                    index: index,
                    onClick: () => this.openLightbox(index)
                };
            });

            // Use simple grid layout for all devices
            this.fallbackToRegularGrid(photosGrid, gridItems);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    fallbackToRegularGrid(photosGrid, items) {
        photosGrid.style.display = 'grid';
        photosGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        photosGrid.style.gap = '20px';
        photosGrid.innerHTML = '';

        const lang = this.getCurrentLanguage();
        items.forEach((item, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            const photo = this.currentPhotos[index];
            const captionText = lang === 'en'
                ? (photo.captionEn || photo.caption || '')
                : (photo.caption || photo.captionEn || '');
            photoItem.innerHTML = `<img src="${item.url}" alt="${captionText || `Photo ${index + 1}`}" loading="lazy">`;
            photoItem.addEventListener('click', () => this.openLightbox(index));
            photosGrid.appendChild(photoItem);
        });
    }

    closePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) {
            const photosGrid = document.querySelector('.photos-grid');
            if (photosGrid) {
                photosGrid.style.display = '';
                photosGrid.style.gridTemplateColumns = '';
                photosGrid.style.gap = '';
            }
            
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Update URL back to photos list
            this.updateUrlForPhotosList();
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
        // Use event delegation for view photos buttons and cover images
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
            
            // Check if click is on the cover image (event-card-image) or image inside it
            const eventCardImage = e.target.closest('.event-card-image');
            if (eventCardImage) {
                // Don't trigger if clicking on the button inside the card
                if (!e.target.closest('.view-photos-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const eventCard = eventCardImage.closest('.event-card');
                    if (eventCard) {
                        const eventId = eventCard.getAttribute('data-gallery-id');
                        if (eventId) {
                            this.openEventPhotos(eventId);
                        }
                    }
                    return;
                }
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