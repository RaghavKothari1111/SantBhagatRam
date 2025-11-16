// Apple TV+ Style Hero Slider - Full Page
let currentIndex = 0;
let totalSlides = 0; // Will be set dynamically
let autoPlayInterval;
let isAutoPlaying = false; // Auto-play disabled by default
let isDragging = false;
let startX = 0;
let currentX = 0;
let dragOffset = 0;
let isTransitioning = false;

const container = document.getElementById('itemContainer');
let dots = document.querySelectorAll('.dot');
const playPauseIcon = document.getElementById('playPauseIcon');
let slides = document.querySelectorAll('.gallery-item');

// Helper function to detect mobile
function isMobileDevice() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// Helper function to get transition duration based on device
function getTransitionDuration() {
    return isMobileDevice() ? 400 : 800; // 0.4s for mobile, 0.8s for desktop
}

// Helper function to get transition string based on device
function getTransitionString() {
    if (isMobileDevice()) {
        return 'left 0.4s ease-out, opacity 0.4s ease-out';
    } else {
        return 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    }
}

// Initialize totalSlides dynamically
function initializeSlider() {
    slides = document.querySelectorAll('.gallery-item');
    totalSlides = slides.length;
    dots = document.querySelectorAll('.dot');
    
    if (totalSlides === 0) {
        console.warn('No slider images found');
        return false;
    }
    return true;
}

// Calculate slide positions - 0.6:1:0.6 proportion with gaps
function calculateSlidePositions(instant = false) {
    if (!slides || slides.length === 0) return;
    
    const containerWidth = container.offsetWidth || window.innerWidth;
    const centerSlideWidth = containerWidth * 0.65; // Center slide is 65% of container
    const sideSlideVisibleWidth = centerSlideWidth * 0.6; // Left/right show 60% of center width
    const gap = containerWidth * 0.015; // 1.5% gap between slides (small but visible)
    
    // Calculate positions for 0.6:1:0.6 proportion with gaps
    // Center slide: full width (65%), centered at container center
    // Left slide: shows 60% of center width on left side
    // Right slide: shows 60% of center width on right side
    const centerX = containerWidth / 2;
    
    // Center slide edges (in pixels)
    const centerLeftEdge = centerX - (centerSlideWidth / 2);
    const centerRightEdge = centerX + (centerSlideWidth / 2);
    
    // For 0.6:1:0.6 proportion with gaps:
    // Left slide should show exactly 60% of center width (39% of container) visible
    // Right slide should show exactly 60% of center width (39% of container) visible
    
    // Left slide: 
    // - The visible right edge should be at: centerLeftEdge - gap
    // - Since left slide is centerSlideWidth wide and we want 60% visible:
    // - The visible part is the right 60% of the left slide
    // - Left slide right edge = centerLeftEdge - gap
    // - Left slide center = (left slide right edge) - (centerSlideWidth / 2)
    const leftSlideRightEdge = centerLeftEdge - gap;
    const leftSlideCenterX = leftSlideRightEdge - (centerSlideWidth / 2);
    
    // Right slide:
    // - The visible left edge should be at: centerRightEdge + gap
    // - Since right slide is centerSlideWidth wide and we want 60% visible:
    // - The visible part is the left 60% of the right slide
    // - Right slide left edge = centerRightEdge + gap
    // - Right slide center = (right slide left edge) + (centerSlideWidth / 2)
    const rightSlideLeftEdge = centerRightEdge + gap;
    const rightSlideCenterX = rightSlideLeftEdge + (centerSlideWidth / 2);
    
    // Calculate relative position from current index with proper wrapping
    slides.forEach((slide, index) => {
        let relativeIndex = index - currentIndex;
        
        // Handle wrapping for circular carousel
        if (currentIndex === 0 && index === totalSlides - 1) {
            relativeIndex = -1; // Last slide on left when at first
        } else if (currentIndex === totalSlides - 1 && index === 0) {
            relativeIndex = 1; // First slide on right when at last
        } else {
            if (relativeIndex > totalSlides / 2) {
                relativeIndex -= totalSlides;
            } else if (relativeIndex < -totalSlides / 2) {
                relativeIndex += totalSlides;
            }
        }
        
        // Calculate horizontal position based on relative index
        let finalX = centerX;
        if (relativeIndex === -1) {
            // Left slide
            finalX = leftSlideCenterX;
        } else if (relativeIndex === 1) {
            // Right slide
            finalX = rightSlideCenterX;
        } else if (relativeIndex === 0) {
            // Center slide
            finalX = centerX;
        } else {
            // Hidden slides - position off-screen
            finalX = centerX + (relativeIndex * (centerSlideWidth + gap * 2));
        }
        
        // Apply drag offset
        finalX += (dragOffset * containerWidth / 100);
        
        // Apply position
        if (instant || isDragging) {
            slide.style.transition = 'none';
        } else {
            slide.style.transition = getTransitionString();
        }
        
        slide.style.left = `${finalX}px`;
        slide.style.transform = `translate(-50%, -50%)`;
        
        // Apply styling based on distance from center
        const distance = Math.abs(relativeIndex);
        
        // Calculate overlay opacity smoothly based on distance
        // When distance is 0 (center), opacity is 0
        // When distance is 1 (adjacent), opacity is 1
        // Smoothly interpolate for intermediate positions
        let overlayOpacity = 0;
        if (distance === 0) {
            // Center slide - fully visible, no overlay
            overlayOpacity = 0;
            slide.style.opacity = '1';
            slide.style.zIndex = '10';
            slide.style.pointerEvents = 'auto';
        } else if (distance === 1) {
            // Adjacent slides - partially visible, with white overlay
            overlayOpacity = 1; // Full overlay opacity for side slides
            slide.style.opacity = '1';
            slide.style.zIndex = '5';
            slide.style.pointerEvents = 'auto';
        } else {
            // Hidden slides - still apply overlay but they're not visible
            overlayOpacity = 1;
            slide.style.opacity = '0';
            slide.style.zIndex = '1';
            slide.style.pointerEvents = 'none';
        }
        
        // Apply overlay opacity smoothly via CSS custom property
        // This allows smooth transitions as slides move
        slide.style.setProperty('--overlay-opacity', overlayOpacity);
    });
}

function updateSlider() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    dragOffset = 0;
    
    // Re-enable transitions
    slides.forEach(slide => {
        slide.style.transition = getTransitionString();
    });
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
    
    // Animate to new positions
    calculateSlidePositions();
    
    const duration = getTransitionDuration();
    setTimeout(() => {
        isTransitioning = false;
    }, duration);
}

function nextImage() {
    if (isTransitioning || isDragging) return;
    
    // Check if we're at the last slide
    if (currentIndex === totalSlides - 1) {
        // Allow smooth transition to first slide
        isTransitioning = true;
        currentIndex = 0;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Allow normal transition to occur
        updateSlider();
        
        // After transition completes, reset position instantly (invisible to user)
        setTimeout(() => {
            // Disable transitions for instant reset
            slides.forEach(slide => {
                slide.style.transition = 'none';
            });
            
            // Reset position to actual first slide position
            calculateSlidePositions(true);
            
            // Force reflow
            void container.offsetWidth;
            
            // Re-enable transitions for next movement
            slides.forEach(slide => {
                slide.style.transition = getTransitionString();
            });
            
            isTransitioning = false;
        }, getTransitionDuration()); // Match transition duration
    } else {
        // Normal forward movement
        currentIndex++;
        updateSlider();
    }
}

function prevImage() {
    if (isTransitioning || isDragging) return;
    
    // Check if we're at the first slide
    if (currentIndex === 0) {
        // Allow smooth transition to last slide
        isTransitioning = true;
        currentIndex = totalSlides - 1;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Allow normal transition to occur
        updateSlider();
        
        // After transition completes, reset position instantly (invisible to user)
        setTimeout(() => {
            // Disable transitions for instant reset
            slides.forEach(slide => {
                slide.style.transition = 'none';
            });
            
            // Reset position to actual last slide position
            calculateSlidePositions(true);
            
            // Force reflow
            void container.offsetWidth;
            
            // Re-enable transitions for next movement
            slides.forEach(slide => {
                slide.style.transition = getTransitionString();
            });
            
            isTransitioning = false;
        }, getTransitionDuration()); // Match transition duration
    } else {
        // Normal backward movement
        currentIndex--;
        updateSlider();
    }
}

function goToSlide(index) {
    if (isTransitioning || isDragging || index === currentIndex) return;
    
    currentIndex = index;
    updateSlider();
}

function startAutoPlay() {
    if (autoPlayInterval) return;
    autoPlayInterval = setInterval(nextImage, 4000);
    isAutoPlaying = true;
    if (playPauseIcon) {
        playPauseIcon.src = '/static/images/slider/pause.png';
        playPauseIcon.alt = 'Pause';
    }
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    isAutoPlaying = false;
    if (playPauseIcon) {
        playPauseIcon.src = '/static/images/slider/play-buttton.png';
        playPauseIcon.alt = 'Play';
    }
}

function toggleAutoPlay() {
    if (isAutoPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

// Drag functionality
function handleDragStart(e) {
    if (isTransitioning) return;
    
    isDragging = true;
    stopAutoPlay();
    
    if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
    } else {
        startX = e.clientX;
        e.preventDefault();
    }
    
    // Disable transitions during drag
    slides.forEach(slide => {
        slide.style.transition = 'none';
    });
}

function handleDragMove(e) {
    if (!isDragging) return;
    
    let clientX;
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        e.preventDefault(); // Prevent scrolling while dragging
    } else {
        clientX = e.clientX;
        e.preventDefault();
    }
    
    currentX = clientX;
    const containerWidth = container.offsetWidth || window.innerWidth;
    dragOffset = ((currentX - startX) / containerWidth) * 100;
    
    // Limit drag offset
    dragOffset = Math.max(-50, Math.min(50, dragOffset));
    
    calculateSlidePositions();
}

function handleDragEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Re-enable transitions
    slides.forEach(slide => {
        slide.style.transition = getTransitionString();
    });
    
    // Lower threshold for mobile devices (easier to trigger)
    const threshold = isMobileDevice() ? 10 : 15; // Percentage threshold to trigger slide change
    const duration = getTransitionDuration();
    
    if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0) {
            // Moving right (showing previous)
            if (currentIndex === 0) {
                // At first slide, transition to last
                isTransitioning = true;
                currentIndex = totalSlides - 1;
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentIndex);
                });
                updateSlider();
                
                // Reset after transition
                setTimeout(() => {
                    slides.forEach(slide => {
                        slide.style.transition = 'none';
                    });
                    calculateSlidePositions(true);
                    void container.offsetWidth;
                    slides.forEach(slide => {
                        slide.style.transition = getTransitionString();
                    });
                    isTransitioning = false;
                }, duration);
            } else {
                currentIndex--;
                updateSlider();
            }
        } else {
            // Moving left (showing next)
            if (currentIndex === totalSlides - 1) {
                // At last slide, transition to first
                isTransitioning = true;
                currentIndex = 0;
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === currentIndex);
                });
                updateSlider();
                
                // Reset after transition
                setTimeout(() => {
                    slides.forEach(slide => {
                        slide.style.transition = 'none';
                    });
                    calculateSlidePositions(true);
                    void container.offsetWidth;
                    slides.forEach(slide => {
                        slide.style.transition = getTransitionString();
                    });
                    isTransitioning = false;
                }, duration);
            } else {
                currentIndex++;
                updateSlider();
            }
        }
    } else {
        // Snap back to current slide
        dragOffset = 0;
        updateSlider();
    }
    
    // Don't resume autoplay - auto-play is disabled
}

// Touch and mouse drag support
if (container) {
    // Touch events for mobile
    container.addEventListener('touchstart', handleDragStart, { passive: false });
    container.addEventListener('touchmove', handleDragMove, { passive: false });
    container.addEventListener('touchend', handleDragEnd, { passive: false });
    container.addEventListener('touchcancel', handleDragEnd, { passive: false });
    
    // Mouse drag support for desktop
    container.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('mouseleave', handleDragEnd); // Handle mouse leaving window
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
        prevImage();
    } else if (e.key === 'ArrowRight') {
        nextImage();
    } else if (e.key === ' ') {
        e.preventDefault();
        toggleAutoPlay();
    }
});

// Hover pause disabled - auto-play continues on hover
// Removed hover pause functionality as requested

// Initialize
let isInitialLoad = true;
document.addEventListener('DOMContentLoaded', function () {
    // Initialize slider with dynamic slide count
    if (!initializeSlider()) {
        return;
    }
    
    // Wait for images to load for accurate positioning
    if (slides.length > 0) {
        let imagesLoaded = 0;
        const totalImages = slides.length;
        
        slides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img) {
                if (img.complete) {
                    imagesLoaded++;
                } else {
                    img.addEventListener('load', () => {
                        imagesLoaded++;
                        if (imagesLoaded === totalImages) {
                            // Initial load - no transition
                            calculateSlidePositions(true);
                            isInitialLoad = false;
                        }
                    });
                }
            } else {
                imagesLoaded++;
            }
        });
        
        if (imagesLoaded === totalImages) {
            // Initial load - no transition
            calculateSlidePositions(true);
            isInitialLoad = false;
        }
    } else {
        // Initial load - no transition
        calculateSlidePositions(true);
        isInitialLoad = false;
    }
    
    // Start auto-play after a short delay
    setTimeout(() => {
        if (!isAutoPlaying) {
            startAutoPlay();
        }
    }, 1000);
});

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // On resize, use instant positioning to avoid transitions
        calculateSlidePositions(true);
    }, 250);
});
