// Masonry Grid - Vanilla JavaScript Implementation
class MasonryGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            ease: options.ease || 'power3.out',
            duration: options.duration || 0.6,
            stagger: options.stagger || 0.05,
            animateFrom: options.animateFrom || 'bottom',
            scaleOnHover: options.scaleOnHover !== false,
            hoverScale: options.hoverScale || 0.95,
            blurToFocus: options.blurToFocus !== false,
            colorShiftOnHover: options.colorShiftOnHover || false
        };

        this.items = [];
        this.grid = [];
        this.columns = this.getColumns();
        this.hasMounted = false;
        this.resizeObserver = null;
        this.mediaQueries = [];
        this.imageDimensions = {};

        this.init();
    }

    getColumns() {
        const width = window.innerWidth;
        const isMobile = width <= 768;
        
        if (isMobile) {
            // Mobile: 2 columns for tablets, 1-2 for phones
            if (width >= 600) return 2;
            if (width >= 400) return 2;
            return 1;
        }
        
        // Desktop
        if (width >= 1500) return 5;
        if (width >= 1000) return 4;
        if (width >= 600) return 3;
        if (width >= 400) return 2;
        return 1;
    }

    init() {
        // Setup resize observer
        this.setupResizeObserver();
        
        // Setup media query listeners
        this.setupMediaQueries();

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateLayout();
            });
            this.resizeObserver.observe(this.container);
        }
    }

    setupMediaQueries() {
        const breakpoints = [
            { query: '(min-width: 1500px)', columns: 5 },
            { query: '(min-width: 1000px)', columns: 4 },
            { query: '(min-width: 600px)', columns: 3 },
            { query: '(min-width: 400px)', columns: 2 }
        ];

        breakpoints.forEach(({ query, columns }) => {
            const mq = window.matchMedia(query);
            const handler = (e) => {
                if (e.matches) {
                    this.columns = columns;
                    this.updateLayout();
                }
            };
            mq.addEventListener('change', handler);
            this.mediaQueries.push({ mq, handler });
        });
    }

    handleResize() {
        const newColumns = this.getColumns();
        if (newColumns !== this.columns) {
            this.columns = newColumns;
            this.updateLayout();
        }
    }

    preloadImages(urls) {
        return Promise.all(
            urls.map(src => 
                new Promise(resolve => {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => {
                        // Store dimensions for later use
                        if (!this.imageDimensions) this.imageDimensions = {};
                        this.imageDimensions[src] = {
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        };
                        resolve();
                    };
                    img.onerror = () => resolve();
                })
            )
        );
    }

    getInitialPosition(item) {
        const containerRect = this.container.getBoundingClientRect();
        if (!containerRect) return { x: item.x, y: item.y };

        let direction = this.options.animateFrom;
        if (direction === 'random') {
            const directions = ['top', 'bottom', 'left', 'right'];
            direction = directions[Math.floor(Math.random() * directions.length)];
        }

        switch (direction) {
            case 'top':
                return { x: item.x, y: -200 };
            case 'bottom':
                return { x: item.x, y: window.innerHeight + 200 };
            case 'left':
                return { x: -200, y: item.y };
            case 'right':
                return { x: window.innerWidth + 200, y: item.y };
            case 'center':
                return {
                    x: containerRect.width / 2 - item.w / 2,
                    y: containerRect.height / 2 - item.h / 2
                };
            default:
                return { x: item.x, y: item.y + 100 };
        }
    }

    calculateGrid(items) {
        const width = this.container.offsetWidth;
        if (!width) return [];

        const colHeights = new Array(this.columns).fill(0);
        const columnWidth = width / this.columns;
        const isMobile = window.innerWidth <= 768;
        const padding = isMobile ? 8 : 12; // Smaller padding on mobile

        const grid = items.map((item, index) => {
            const col = colHeights.indexOf(Math.min(...colHeights));
            const x = columnWidth * col;
            
            // Calculate height based on image aspect ratio
            let height = item.height || 300;
            const imgUrl = item.img || item.url;
            
            // Use actual image dimensions if available
            if (this.imageDimensions[imgUrl]) {
                const imgDim = this.imageDimensions[imgUrl];
                const aspectRatio = imgDim.height / imgDim.width;
                height = (columnWidth - padding) * aspectRatio;
            } else if (item.height) {
                // Use provided height, scale to column width
                const aspectRatio = item.height / (item.width || columnWidth);
                height = (columnWidth - padding) * aspectRatio;
            } else {
                // Default aspect ratio
                height = (columnWidth - padding) * 1.2;
            }
            
            const y = colHeights[col];
            colHeights[col] += height + padding;

            return {
                ...item,
                x,
                y,
                w: columnWidth - padding,
                h: height,
                index
            };
        });

        // Set container height to tallest column
        const maxHeight = Math.max(...colHeights);
        if (maxHeight > 0) {
            this.container.style.height = maxHeight + 'px';
        }

        return grid;
    }

    async setItems(items) {
        try {
            this.items = items;
            
            if (!items || items.length === 0) {
                console.warn('No items to display');
                throw new Error('No items to display');
            }

            // Check container is ready
            if (!this.container || this.container.offsetWidth === 0) {
                console.warn('Container not ready');
                throw new Error('Container not ready');
            }

            // Preload images with timeout
            const imageUrls = items.map(item => item.img || item.url);
            await Promise.race([
                this.preloadImages(imageUrls),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Image preload timeout')), 5000))
            ]).catch(err => {
                console.warn('Image preload timeout or error, continuing anyway:', err);
                // Continue even if preload fails
            });

            // Calculate grid
            this.grid = this.calculateGrid(items);
            
            if (!this.grid || this.grid.length === 0) {
                console.warn('Grid calculation returned empty');
                throw new Error('Grid calculation returned empty');
            }
            
            // Render items
            this.render();
            
            // Return success
            return Promise.resolve();
        } catch (error) {
            console.error('Error in setItems:', error);
            throw error;
        }
    }

    render() {
        // Clear container only if it exists
        if (!this.container) {
            console.error('Container not found for rendering');
            return;
        }
        
        // Validate grid before clearing
        if (!this.grid || this.grid.length === 0) {
            console.error('Cannot render: grid is empty');
            return;
        }
        
        // Clear container
        this.container.innerHTML = '';

        // Create items
        this.grid.forEach((item) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'masonry-item';
            itemWrapper.setAttribute('data-key', item.id || item.index);
            itemWrapper.style.width = item.w + 'px';
            itemWrapper.style.height = item.h + 'px';

            const itemImg = document.createElement('div');
            itemImg.className = 'masonry-item-img';
            itemImg.style.backgroundImage = `url(${item.img || item.url})`;

            if (this.options.colorShiftOnHover) {
                const overlay = document.createElement('div');
                overlay.className = 'masonry-color-overlay';
                itemImg.appendChild(overlay);
            }

            itemWrapper.appendChild(itemImg);
            this.container.appendChild(itemWrapper);

            // Add click handler
            itemWrapper.addEventListener('click', () => {
                if (item.onClick) {
                    item.onClick(item);
                }
            });

            // Add hover handlers (desktop only)
            if (!window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
                if (this.options.scaleOnHover || this.options.colorShiftOnHover) {
                    itemWrapper.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, item));
                    itemWrapper.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, item));
                }
            }
            
            // Add touch feedback for mobile
            if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
                itemWrapper.addEventListener('touchstart', () => {
                    const imgElement = itemWrapper.querySelector('.masonry-item-img');
                    if (imgElement) {
                        imgElement.style.transform = 'scale(0.97)';
                    }
                });
                itemWrapper.addEventListener('touchend', () => {
                    const imgElement = itemWrapper.querySelector('.masonry-item-img');
                    if (imgElement) {
                        setTimeout(() => {
                            imgElement.style.transform = 'scale(1)';
                        }, 100);
                    }
                });
            }
        });

        // Animate items
        this.animateItems();
    }

    animateItems() {
        this.grid.forEach((item, index) => {
            const element = this.container.querySelector(`[data-key="${item.id || item.index}"]`);
            if (!element) return;

            const animationProps = {
                x: item.x,
                y: item.y,
                width: item.w,
                height: item.h
            };

            if (!this.hasMounted) {
                // Initial animation
                const initialPos = this.getInitialPosition(item);
                const initialState = {
                    opacity: 0,
                    x: initialPos.x,
                    y: initialPos.y,
                    width: item.w,
                    height: item.h
                };

                if (this.options.blurToFocus) {
                    element.style.filter = 'blur(10px)';
                }

                // Use GSAP if available, otherwise use CSS transitions
                if (window.gsap) {
                    gsap.fromTo(element, initialState, {
                        opacity: 1,
                        x: animationProps.x,
                        y: animationProps.y,
                        width: animationProps.width,
                        height: animationProps.height,
                        filter: 'blur(0px)',
                        duration: 0.8,
                        ease: this.options.ease,
                        delay: index * this.options.stagger
                    });
                } else {
                    // Fallback to CSS animations - set initial state
                    element.style.opacity = '0';
                    element.style.transform = `translate(${initialPos.x}px, ${initialPos.y}px)`;
                    element.style.width = item.w + 'px';
                    element.style.height = item.h + 'px';
                    element.style.transition = 'none';

                    // Force reflow
                    element.offsetHeight;

                    // Animate to final position
                    // Faster animations on mobile
                    const isMobile = window.innerWidth <= 768;
                    const staggerDelay = isMobile ? index * this.options.stagger * 300 : index * this.options.stagger * 1000;
                    const duration = isMobile ? '0.5s' : '0.8s';
                    
                    setTimeout(() => {
                        element.style.transition = `opacity ${duration} ease, transform ${duration} ease, filter ${duration} ease`;
                        element.style.opacity = '1';
                        element.style.transform = `translate(${item.x}px, ${item.y}px)`;
                        if (this.options.blurToFocus && !isMobile) {
                            element.style.filter = 'blur(0px)';
                        } else {
                            element.style.filter = 'blur(0px)';
                        }
                    }, staggerDelay);
                }
            } else {
                // Update existing items
                if (window.gsap) {
                    gsap.to(element, {
                        x: animationProps.x,
                        y: animationProps.y,
                        width: animationProps.width,
                        height: animationProps.height,
                        duration: this.options.duration,
                        ease: this.options.ease,
                        overwrite: 'auto'
                    });
                } else {
                    element.style.transition = `transform ${this.options.duration}s ease, width ${this.options.duration}s ease, height ${this.options.duration}s ease`;
                    element.style.transform = `translate(${item.x}px, ${item.y}px)`;
                    element.style.width = item.w + 'px';
                    element.style.height = item.h + 'px';
                    element.style.opacity = '1'; // Ensure visible
                }
            }
        });

        this.hasMounted = true;
    }

    handleMouseEnter(e, item) {
        const element = e.currentTarget;
        const selector = `[data-key="${item.id || item.index}"]`;
        const imgElement = element.querySelector('.masonry-item-img');

        if (this.options.scaleOnHover && imgElement) {
            if (window.gsap) {
                gsap.to(imgElement, {
                    scale: this.options.hoverScale,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            } else {
                imgElement.style.transform = `scale(${this.options.hoverScale})`;
            }
        }

        if (this.options.colorShiftOnHover) {
            const overlay = element.querySelector('.masonry-color-overlay');
            if (overlay) {
                if (window.gsap) {
                    gsap.to(overlay, {
                        opacity: 0.3,
                        duration: 0.3
                    });
                } else {
                    overlay.style.opacity = '0.3';
                }
            }
        }
    }

    handleMouseLeave(e, item) {
        const element = e.currentTarget;
        const selector = `[data-key="${item.id || item.index}"]`;
        const imgElement = element.querySelector('.masonry-item-img');

        if (this.options.scaleOnHover && imgElement) {
            if (window.gsap) {
                gsap.to(imgElement, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            } else {
                imgElement.style.transform = 'scale(1)';
            }
        }

        if (this.options.colorShiftOnHover) {
            const overlay = element.querySelector('.masonry-color-overlay');
            if (overlay) {
                if (window.gsap) {
                    gsap.to(overlay, {
                        opacity: 0,
                        duration: 0.3
                    });
                } else {
                    overlay.style.opacity = '0';
                }
            }
        }
    }

    updateLayout() {
        if (this.items.length === 0) return;
        this.grid = this.calculateGrid(this.items);
        this.animateItems();
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.mediaQueries.forEach(({ mq, handler }) => {
            mq.removeEventListener('change', handler);
        });
        window.removeEventListener('resize', this.handleResize);
    }
}

// Export for use
window.MasonryGrid = MasonryGrid;

