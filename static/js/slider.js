// Apple TV+ Style Hero Slider - Full Page
let currentIndex = 0;
let totalSlides = 0; // Total slides including clones
let realTotalSlides = 0; // Original slide count (without clones)
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
    realTotalSlides = slides.length; // Store original count
    totalSlides = realTotalSlides; // Will be updated after cloning
    dots = document.querySelectorAll('.dot');
    
    if (realTotalSlides === 0) {
        console.warn('No slider images found');
        return false;
    }
    
    // Clone first and last slides for infinite loop
    if (realTotalSlides > 1 && container) {
        // Remove existing clones if any
        const existingClones = container.querySelectorAll('.gallery-item[data-clone="true"]');
        existingClones.forEach(clone => clone.remove());
        
        // Clone first slide and append to end
        const firstSlide = slides[0];
        const firstClone = firstSlide.cloneNode(true);
        firstClone.setAttribute('data-clone', 'true');
        firstClone.id = 'first-clone';
        firstClone.setAttribute('data-index', realTotalSlides.toString());
        container.appendChild(firstClone);
        
        // Clone last slide and insert at beginning
        const lastSlide = slides[realTotalSlides - 1];
        const lastClone = lastSlide.cloneNode(true);
        lastClone.setAttribute('data-clone', 'true');
        lastClone.id = 'last-clone';
        lastClone.setAttribute('data-index', '-1');
        container.insertBefore(lastClone, firstSlide);
        
        // Update slides reference to include clones
        slides = document.querySelectorAll('.gallery-item');
        totalSlides = slides.length; // Now includes clones
        
        // Start at index 1 (first real slide, after last clone)
        currentIndex = 1;
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
    
    // Calculate relative position from current index
    // Account for clones: last clone is at index 0, real slides start at 1
    slides.forEach((slide, index) => {
        let relativeIndex = index - currentIndex;
        
        // Handle clones and wrapping
        const isLastClone = slide.id === 'last-clone';
        const isFirstClone = slide.id === 'first-clone';
        
        if (isLastClone) {
            // Last clone should be at position -1 when currentIndex is 1 (first real slide)
            relativeIndex = (index === 0 && currentIndex === 1) ? -1 : relativeIndex;
        } else if (isFirstClone) {
            // First clone should be at position +1 when currentIndex is last real slide
            const lastRealIndex = realTotalSlides; // Last real slide is at index realTotalSlides
            relativeIndex = (currentIndex === lastRealIndex) ? 1 : relativeIndex;
        } else {
            // For real slides, adjust relative index
            // Real slides are from index 1 to realTotalSlides
            if (relativeIndex > realTotalSlides / 2) {
                relativeIndex -= realTotalSlides;
            } else if (relativeIndex < -realTotalSlides / 2) {
                relativeIndex += realTotalSlides;
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
    if (isTransitioning && !transitionEndHandled) return;
    
    isTransitioning = true;
    dragOffset = 0;
    transitionEndHandled = false;
    
    // Clear any existing timeout
    if (cloneJumpTimeout) {
        clearTimeout(cloneJumpTimeout);
        cloneJumpTimeout = null;
    }
    
    // Re-enable transitions
    slides.forEach(slide => {
        slide.style.transition = getTransitionString();
    });
    
    // Animate to new positions
    calculateSlidePositions();
    
    // For mobile, use a shorter timeout and rely on transitionend event
    const duration = getTransitionDuration();
    const timeoutDuration = isMobileDevice() ? duration + 100 : duration;
    
    // Set up fallback timeout for clone jumps (in case transitionend doesn't fire)
    if (currentIndex === realTotalSlides + 1 || currentIndex === 0) {
        // For mobile, use a slightly longer timeout to ensure smooth transition
        const cloneJumpTimeoutDuration = isMobileDevice() ? timeoutDuration + 50 : timeoutDuration;
        cloneJumpTimeout = setTimeout(() => {
            if (!transitionEndHandled) {
                handleCloneJump();
            }
        }, cloneJumpTimeoutDuration);
    }
    
    setTimeout(() => {
        // Only reset if transition end hasn't been handled
        if (!transitionEndHandled) {
            isTransitioning = false;
        }
    }, timeoutDuration);
}

// Handle transition end to fix snapping
let transitionEndHandled = false;
let cloneJumpTimeout = null;

function handleCloneJump() {
    // Check if we're on the first clone (after last real slide)
    if (currentIndex === realTotalSlides + 1) {
        transitionEndHandled = true;
        
        // For mobile, use a shorter delay for smoother transition
        const delay = isMobileDevice() ? 0 : 0;
        
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
            // Small delay for mobile to ensure transition completes
            if (isMobileDevice()) {
                setTimeout(() => {
                    // Instantly jump to first real slide (index 1) without transition
                    slides.forEach(slide => {
                        slide.style.transition = 'none';
                    });
                    
                    currentIndex = 1;
                    calculateSlidePositions(true);
                    
                    // Force reflow
                    void container.offsetWidth;
                    
                    // Re-enable transitions immediately
                    requestAnimationFrame(() => {
                        slides.forEach(slide => {
                            slide.style.transition = getTransitionString();
                        });
                        
                        // Update dots
                        dots.forEach((dot, index) => {
                            dot.classList.toggle('active', index === 0);
                        });
                        
                        // Reset flag and transition state
                        transitionEndHandled = false;
                        isTransitioning = false;
                    });
                }, 100); // Delay for mobile to ensure transition completes smoothly
            } else {
                // Desktop: instant jump
                slides.forEach(slide => {
                    slide.style.transition = 'none';
                });
                
                currentIndex = 1;
                calculateSlidePositions(true);
                
                // Force reflow
                void container.offsetWidth;
                
                // Re-enable transitions after a tiny delay
                requestAnimationFrame(() => {
                    slides.forEach(slide => {
                        slide.style.transition = getTransitionString();
                    });
                    
                    // Update dots
                    dots.forEach((dot, index) => {
                        dot.classList.toggle('active', index === 0);
                    });
                    
                    // Reset flag and transition state
                    transitionEndHandled = false;
                    isTransitioning = false;
                });
            }
        });
        return true;
    }
    
    // Check if we're on the last clone (index 0)
    if (currentIndex === 0) {
        transitionEndHandled = true;
        
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
            // For mobile, add small delay to ensure transition completes
            if (isMobileDevice()) {
                setTimeout(() => {
                    // Instantly jump to last real slide without transition
                    slides.forEach(slide => {
                        slide.style.transition = 'none';
                    });
                    
                    currentIndex = realTotalSlides;
                    calculateSlidePositions(true);
                    
                    // Force reflow
                    void container.offsetWidth;
                    
                    // Re-enable transitions immediately
                    requestAnimationFrame(() => {
                        slides.forEach(slide => {
                            slide.style.transition = getTransitionString();
                        });
                        
                        // Update dots
                        dots.forEach((dot, index) => {
                            dot.classList.toggle('active', index === realTotalSlides - 1);
                        });
                        
                        // Reset flag and transition state
                        transitionEndHandled = false;
                        isTransitioning = false;
                    });
                }, 100); // Delay for mobile to ensure transition completes smoothly
            } else {
                // Desktop: instant jump
                slides.forEach(slide => {
                    slide.style.transition = 'none';
                });
                
                currentIndex = realTotalSlides;
                calculateSlidePositions(true);
                
                // Force reflow
                void container.offsetWidth;
                
                // Re-enable transitions after a tiny delay
                requestAnimationFrame(() => {
                    slides.forEach(slide => {
                        slide.style.transition = getTransitionString();
                    });
                    
                    // Update dots
                    dots.forEach((dot, index) => {
                        dot.classList.toggle('active', index === realTotalSlides - 1);
                    });
                    
                    // Reset flag and transition state
                    transitionEndHandled = false;
                    isTransitioning = false;
                });
            }
        });
        return true;
    }
    
    return false;
}

function handleTransitionEnd(e) {
    // Only handle transitions on gallery items
    if (!e.target.classList.contains('gallery-item')) return;
    
    // Prevent multiple handlers from firing
    if (transitionEndHandled) return;
    
    // Clear any pending timeout
    if (cloneJumpTimeout) {
        clearTimeout(cloneJumpTimeout);
        cloneJumpTimeout = null;
    }
    
    // Try to handle clone jump
    if (handleCloneJump()) {
        return;
    }
    
    // For normal transitions, just reset the flag
    transitionEndHandled = false;
    isTransitioning = false;
}

function nextImage() {
    if ((isTransitioning && !transitionEndHandled) || isDragging) return;
    
    // Check if we're at the last real slide (index = realTotalSlides)
    if (currentIndex >= realTotalSlides) {
        // Move to first clone (smooth transition)
        currentIndex = realTotalSlides + 1; // First clone index
    } else {
        // Normal forward movement
        currentIndex++;
    }
    
    // Update dots based on real slide index
    const realIndex = currentIndex > realTotalSlides ? 0 : (currentIndex < 1 ? realTotalSlides - 1 : currentIndex - 1);
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === realIndex);
    });
    
    updateSlider();
}

function prevImage() {
    if ((isTransitioning && !transitionEndHandled) || isDragging) return;
    
    // Check if we're at the first real slide (index = 1)
    if (currentIndex <= 1) {
        // Move to last clone (smooth transition)
        currentIndex = 0; // Last clone index
    } else {
        // Normal backward movement
        currentIndex--;
    }
    
    // Update dots based on real slide index
    const realIndex = currentIndex === 0 ? realTotalSlides - 1 : (currentIndex > realTotalSlides ? 0 : currentIndex - 1);
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === realIndex);
    });
    
    updateSlider();
}

function goToSlide(index) {
    if ((isTransitioning && !transitionEndHandled) || isDragging) return;
    // Convert real slide index (0-based) to slider index (1-based, accounting for last clone)
    const targetIndex = index + 1; // Real slides start at index 1
    
    if (targetIndex === currentIndex) return;
    
    currentIndex = targetIndex;
    
    // Update dots
    dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === index);
    });
    
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
let startY = 0;
let isHorizontal = false;
let startPageX = 0;
let startPageY = 0;
let prevDragOffset = 0;

function handleDragStart(e) {
    if (isTransitioning && !transitionEndHandled) return;
    
    if (e.type === 'touchstart') {
        const t = e.touches[0];
        // Don't set isDragging yet - wait to determine direction
        isDragging = false;
        isHorizontal = false;
        // Store pageX/pageY for direction detection (accounts for scroll)
        startPageX = t.pageX;
        startPageY = t.pageY;
        // Store clientX for calculations (will be set when horizontal is confirmed)
        startX = t.clientX;
        startY = t.clientY;
        prevDragOffset = dragOffset; // Store current drag offset
    } else {
        isDragging = true;
        isHorizontal = true; // Mouse events are always horizontal
        startX = e.clientX;
        startY = e.clientY;
        prevDragOffset = dragOffset;
        e.preventDefault();
    }
    
    stopAutoPlay();
    
    // Don't disable transitions yet - wait to see if it's horizontal
}

function handleDragMove(e) {
    // For mouse events, check isDragging first
    if (e.type !== 'touchmove' && !isDragging) return;
    
    let clientX, clientY;
    
    if (e.type === 'touchmove') {
        const t = e.touches[0];
        
        // Use pageX/pageY for direction detection (accounts for scroll)
        const pageX = t.pageX;
        const pageY = t.pageY;
        const dx = pageX - startPageX;
        const dy = pageY - startPageY;
        
        // Detect the gesture direction (only if we haven't determined it yet)
        if (!isHorizontal && !isDragging) {
            if (Math.abs(dx) > Math.abs(dy) + 6) {
                // Clear horizontal swipe - now we can start dragging
                isHorizontal = true;
                isDragging = true;
                // Update startX to current clientX for accurate calculations
                startX = t.clientX;
                // Disable ALL transitions immediately for smooth dragging
                slides.forEach(slide => {
                    slide.style.transition = 'none';
                });
                // Reset drag offset to start fresh
                dragOffset = 0;
                prevDragOffset = 0;
            } else if (Math.abs(dy) > Math.abs(dx)) {
                // Vertical scroll -> let page move normally
                isDragging = false;
                isHorizontal = false;
                return; // Don't prevent default, allow vertical scroll
            } else {
                // Not sure yet - wait for more input
                return; // Don't prevent default yet
            }
        }
        
        // Only proceed if we've confirmed it's a horizontal drag
        if (!isDragging || !isHorizontal) {
            return;
        }
        
        // From here on → horizontal ONLY
        e.preventDefault(); // prevent page scroll
        clientX = t.clientX; // Use clientX for calculations
    } else {
        // Mouse events - always horizontal
        clientX = e.clientX;
        e.preventDefault();
        
        if (!isHorizontal) {
            isHorizontal = true;
            slides.forEach(slide => {
                slide.style.transition = 'none';
            });
            dragOffset = 0;
            prevDragOffset = 0;
        }
    }
    
    currentX = clientX;
    const containerWidth = container.offsetWidth || window.innerWidth;
    
    // Calculate drag offset in real-time for smooth dragging
    dragOffset = ((currentX - startX) / containerWidth) * 100;
    
    // Allow more drag range for better feel, but limit to prevent extreme values
    dragOffset = Math.max(-60, Math.min(60, dragOffset));
    
    // Update positions in real-time during drag (no transition = instant update)
    calculateSlidePositions(true); // instant = true to prevent any transitions
}

function handleDragEnd(e) {
    if (!isDragging) {
        isDragging = false;
        isHorizontal = false;
        return;
    }
    
    isDragging = false;
    isHorizontal = false;
    
    // Lower threshold for mobile devices (easier to trigger)
    const threshold = isMobileDevice() ? 8 : 15; // Percentage threshold to trigger slide change
    
    // Determine if we should change slides based on drag distance
    if (Math.abs(dragOffset) > threshold) {
        // User dragged enough to change slides
        if (dragOffset > 0) {
            // Moving right (showing previous) - swipe left
            if (currentIndex <= 1) {
                // At first real slide, transition to last clone for infinite loop
                isTransitioning = true;
                transitionEndHandled = false;
                currentIndex = 0; // Last clone
                const realIndex = realTotalSlides - 1;
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === realIndex);
                });
            } else {
                // Normal backward movement
                currentIndex--;
                const realIndex = currentIndex === 0 ? realTotalSlides - 1 : (currentIndex > realTotalSlides ? 0 : currentIndex - 1);
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === realIndex);
                });
            }
        } else {
            // Moving left (showing next) - swipe right
            if (currentIndex >= realTotalSlides) {
                // At last real slide, transition to first clone for infinite loop
                isTransitioning = true;
                transitionEndHandled = false;
                currentIndex = realTotalSlides + 1; // First clone
                const realIndex = 0;
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === realIndex);
                });
            } else {
                // Normal forward movement
                currentIndex++;
                const realIndex = currentIndex > realTotalSlides ? 0 : (currentIndex < 1 ? realTotalSlides - 1 : currentIndex - 1);
                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === realIndex);
                });
            }
        }
        
        // Reset drag offset before transitioning
        dragOffset = 0;
        prevDragOffset = 0;
        
        // Set transitioning state
        isTransitioning = true;
        transitionEndHandled = false;
        
        // Re-enable transitions for smooth slide change
        slides.forEach(slide => {
            slide.style.transition = getTransitionString();
        });
        
        // Update slider position with smooth transition
        // Use requestAnimationFrame to ensure smooth transition start
        requestAnimationFrame(() => {
            calculateSlidePositions(false); // false = use transitions
            // The transitionend event will handle the clone-to-real jump
        });
        
        // Set up fallback timeout for clone jumps (in case transitionend doesn't fire)
        if (currentIndex === realTotalSlides + 1 || currentIndex === 0) {
            const duration = getTransitionDuration();
            const timeoutDuration = isMobileDevice() ? duration + 150 : duration;
            if (cloneJumpTimeout) {
                clearTimeout(cloneJumpTimeout);
            }
            cloneJumpTimeout = setTimeout(() => {
                if (!transitionEndHandled) {
                    handleCloneJump();
                }
            }, timeoutDuration);
        }
    } else {
        // Snap back to current slide (didn't drag enough)
        dragOffset = 0;
        prevDragOffset = 0;
        
        // Set transitioning state for snap-back
        isTransitioning = true;
        
        // Re-enable transitions for snap-back
        slides.forEach(slide => {
            slide.style.transition = getTransitionString();
        });
        
        // Snap back smoothly
        requestAnimationFrame(() => {
            calculateSlidePositions(false);
        });
        
        // Reset transition state after snap-back completes
        const duration = getTransitionDuration();
        setTimeout(() => {
            isTransitioning = false;
            transitionEndHandled = false;
        }, duration);
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
    
    // Listen for transition end to handle clone jumping
    container.addEventListener('transitionend', handleTransitionEnd);
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
