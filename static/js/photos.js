/**
 * Generate responsive image attributes for Cloudinary URLs
 */
function generateResponsiveImageAttrs(url, sizes, defaultWidth = 1200) {
    if (!url) {
        return { src: '', srcset: '', sizes: sizes || '' };
    }
    
    // Check if it's a Cloudinary URL
    const isCloudinary = url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
    
    if (!isCloudinary) {
        // For non-Cloudinary URLs, return as-is
        return { src: url, srcset: '', sizes: sizes || '' };
    }
    
    // Generate srcset with multiple widths
    const widths = [400, 800, 1200, 1600, 2000];
    const srcsetParts = widths.map(width => {
        const transformedUrl = getCloudinaryUrl(url, width);
        return `${transformedUrl} ${width}w`;
    });
    
    // Generate default src
    const src = getCloudinaryUrl(url, defaultWidth);
    
    return {
        src: src,
        srcset: srcsetParts.join(', '),
        sizes: sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
    };
}

/**
 * Get Cloudinary URL with transformations
 */
function getCloudinaryUrl(url, width) {
    if (!url || !url.includes('cloudinary.com')) {
        return url;
    }
    
    // Parse Cloudinary URL and add transformations
    if (url.includes('/upload/')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            const baseUrl = parts[0] + '/upload/';
            const pathPart = parts[1];
            
            // Build transformation string
            const transformations = [
                'f_auto',      // Auto format (WebP, AVIF when supported)
                'q_auto',      // Auto quality
                `w_${width}`,  // Width
                'dpr_auto',    // Device pixel ratio
                'c_auto,g_auto' // Auto crop and gravity
            ];
            
            const transformStr = transformations.join(',');
            return `${baseUrl}${transformStr}/${pathPart}`;
        }
    }
    
    return url;
}

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

            // Use masonry grid only (no regular grid fallback first)
            // Add masonry container class immediately
            photosGrid.classList.add('masonry-container');
            
            // Initialize masonry immediately using requestAnimationFrame for smooth execution
            requestAnimationFrame(() => {
                if (typeof MasonryGrid !== 'undefined' && photosGrid && photosGrid.offsetWidth > 0) {
                    try {
                        // Initialize masonry grid without animations
                        this.masonryInstance = new MasonryGrid(photosGrid, {
                            ease: 'none', // No easing
                            duration: 0, // Instant, no animation
                            stagger: 0, // No stagger
                            animateFrom: 'none', // No entrance animation
                            scaleOnHover: false, // No hover effects
                            blurToFocus: false, // No blur effects
                            colorShiftOnHover: false // No color effects
                        });
                        
                        // Set items and render (instant, no animations)
                        this.masonryInstance.setItems(masonryItems)
                            .catch(err => {
                                console.error('Masonry error:', err);
                                // Fallback to regular grid only if masonry fails
                                if (this.masonryInstance) {
                                    this.masonryInstance.destroy();
                                    this.masonryInstance = null;
                                }
                                photosGrid.classList.remove('masonry-container');
                                this.fallbackToRegularGrid(photosGrid, masonryItems);
                            });
                    } catch (error) {
                        console.error('Masonry initialization error:', error);
                        // Fallback to regular grid only if masonry fails
                        if (this.masonryInstance) {
                            this.masonryInstance.destroy();
                            this.masonryInstance = null;
                        }
                        photosGrid.classList.remove('masonry-container');
                        this.fallbackToRegularGrid(photosGrid, masonryItems);
                    }
                } else {
                    // Masonry not available, use regular grid
                    photosGrid.classList.remove('masonry-container');
                    this.fallbackToRegularGrid(photosGrid, masonryItems);
                }
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    fallbackToRegularGrid(photosGrid, items) {
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
            // Generate responsive image attributes
            const imgAttrs = generateResponsiveImageAttrs(item.url, "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px", 1200);
            photoItem.innerHTML = `<img src="${imgAttrs.src}" 
                                         srcset="${imgAttrs.srcset}" 
                                         sizes="${imgAttrs.sizes}" 
                                         alt="${captionText || `Photo ${index + 1}`}" 
                                         loading="lazy" 
                                         decoding="async">`;
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