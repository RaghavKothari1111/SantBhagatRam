// Photo Gallery JavaScript
class PhotoGallery {
    constructor() {
        this.currentEvent = null;
        this.currentPhotoIndex = 0;
        this.currentPhotos = [];
        this.eventsData = Array.isArray(window.galleryData) ? window.galleryData : [];
        this.masonryInstance = null;
        
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
        
        // Clean up previous masonry instance
        if (this.masonryInstance) {
            this.masonryInstance.destroy();
            this.masonryInstance = null;
        }

        if (!this.currentPhotos.length) {
            const noPhotos = document.createElement('p');
            noPhotos.className = 'no-photos-message';
            noPhotos.setAttribute('data-lang-photos', 'noPhotos');
            noPhotos.textContent = 'जल्द ही तस्वीरें जोड़ी जाएंगी।';
            photosGrid.appendChild(noPhotos);
        } else {
            console.log('Loading photos:', this.currentPhotos.length, 'photos');
            
            // Prepare items for masonry
            const masonryItems = this.currentPhotos.map((photo, index) => {
                const captionText = lang === 'en'
                    ? (photo.captionEn || photo.caption || '')
                    : (photo.caption || photo.captionEn || '');
                
                // Estimate height based on image aspect ratio (default to 400)
                const height = photo.height || 400;
                
                return {
                    id: `photo-${index}`,
                    img: photo.url,
                    url: photo.url,
                    height: height,
                    index: index,
                    onClick: () => this.openLightbox(index)
                };
            });

            // Check if mobile - use simple grid on mobile, masonry on desktop
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // Mobile: Use simple grid layout (more reliable)
                this.fallbackToRegularGrid(photosGrid, masonryItems);
            } else {
                // Desktop: Show photos immediately with regular grid first
                this.fallbackToRegularGrid(photosGrid, masonryItems);

                // Then try to upgrade to masonry if available (desktop only)
                // Use a longer delay to ensure container is ready
                const masonryTimeout = setTimeout(() => {
                    // Safety fallback: if masonry hasn't rendered in 3 seconds, keep regular grid
                    console.warn('Masonry timeout - keeping regular grid');
                }, 3000);

                setTimeout(() => {
                    // Check if MasonryGrid is available and container has width
                    if (typeof MasonryGrid !== 'undefined' && photosGrid && photosGrid.offsetWidth > 0) {
                        try {
                            // Store reference to check if masonry rendered successfully
                            let masonryRendered = false;
                            
                            // Initialize masonry grid (desktop only)
                            this.masonryInstance = new MasonryGrid(photosGrid, {
                                ease: 'power3.out',
                                duration: 0.6,
                                stagger: 0.05,
                                animateFrom: 'bottom',
                                scaleOnHover: true,
                                hoverScale: 0.95,
                                blurToFocus: true,
                                colorShiftOnHover: false
                            });

                            // Add masonry container class before rendering
                            photosGrid.classList.add('masonry-container');
                            
                            // Set items and render with success check
                            this.masonryInstance.setItems(masonryItems)
                                .then(() => {
                                    // Check if masonry actually rendered items
                                    setTimeout(() => {
                                        const renderedMasonryItems = photosGrid.querySelectorAll('.masonry-item');
                                        const hasVisibleMasonryItems = renderedMasonryItems.length > 0 && 
                                            Array.from(renderedMasonryItems).some(item => {
                                                const rect = item.getBoundingClientRect();
                                                return rect.width > 0 && rect.height > 0;
                                            });
                                        
                                        if (hasVisibleMasonryItems) {
                                            masonryRendered = true;
                                            clearTimeout(masonryTimeout);
                                            // Remove regular grid items (they were already cleared by masonry, but check anyway)
                                            const regularItems = photosGrid.querySelectorAll('.photo-item');
                                            regularItems.forEach(item => item.remove());
                                        } else {
                                            // Masonry didn't render properly, restore regular grid
                                            console.warn('Masonry did not render items properly, restoring regular grid');
                                            clearTimeout(masonryTimeout);
                                            
                                            // Clean up masonry instance first
                                            if (this.masonryInstance) {
                                                this.masonryInstance.destroy();
                                                this.masonryInstance = null;
                                            }
                                            
                                            // Clear masonry and restore regular grid
                                            photosGrid.innerHTML = '';
                                            photosGrid.classList.remove('masonry-container');
                                            
                                            // Always recreate regular grid (backup won't work after DOM detachment)
                                            this.fallbackToRegularGrid(photosGrid, masonryItems);
                                        }
                                    }, 1000); // Give more time for masonry to render and become visible
                                })
                                .catch(err => {
                                    console.error('Masonry error:', err);
                                    clearTimeout(masonryTimeout);
                                    
                                    // Clean up masonry instance
                                    if (this.masonryInstance) {
                                        this.masonryInstance.destroy();
                                        this.masonryInstance = null;
                                    }
                                    
                                    // Clear and restore regular grid
                                    photosGrid.innerHTML = '';
                                    photosGrid.classList.remove('masonry-container');
                                    this.fallbackToRegularGrid(photosGrid, masonryItems);
                                });
                        } catch (error) {
                            console.error('Masonry initialization error:', error);
                            clearTimeout(masonryTimeout);
                            
                            // Clean up masonry instance
                            if (this.masonryInstance) {
                                this.masonryInstance.destroy();
                                this.masonryInstance = null;
                            }
                            
                            // Ensure regular grid is visible
                            photosGrid.classList.remove('masonry-container');
                            // Regular grid should already be visible, but ensure it's there
                            const existingItems = photosGrid.querySelectorAll('.photo-item');
                            if (existingItems.length === 0) {
                                this.fallbackToRegularGrid(photosGrid, masonryItems);
                            }
                        }
                    } else {
                        clearTimeout(masonryTimeout);
                        // Masonry not available or container not ready, keep regular grid
                        if (typeof MasonryGrid === 'undefined') {
                            console.warn('MasonryGrid not available');
                        } else {
                            console.warn('Container not ready for masonry');
                        }
                    }
                }, 300);
            }
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    fallbackToRegularGrid(photosGrid, items) {
        console.log('Using fallback regular grid');
        photosGrid.classList.remove('masonry-container');
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
            // Clean up masonry instance
            if (this.masonryInstance) {
                this.masonryInstance.destroy();
                this.masonryInstance = null;
            }
            
            const photosGrid = document.querySelector('.photos-grid');
            if (photosGrid) {
                photosGrid.classList.remove('masonry-container');
                photosGrid.style.display = '';
                photosGrid.style.gridTemplateColumns = '';
                photosGrid.style.gap = '';
            }
            
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