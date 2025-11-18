/**
 * Auto-Scrolling Objectives Carousel
 * 
 * Features:
 * - Auto-scrolls continuously on mobile (<768px) using requestAnimationFrame
 * - Swipe left/right to drag the carousel
 * - Tap anywhere to pause/resume auto-scroll
 * - Desktop remains static (CSS animation only)
 * - Smooth, conflict-free scrolling
 * 
 * Usage:
 * - Automatically initializes when DOM is ready
 * - Requires element with id="objectives-scroll-track"
 * - Requires parent with class="objectives-scroll-wrapper"
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        const scrollTrack = document.getElementById('objectives-scroll-track');
        const scrollWrapper = document.querySelector('.objectives-scroll-wrapper');
        
        if (!scrollTrack || !scrollWrapper) {
            return;
        }
        
        // Check if device is mobile (only by screen width)
        function isMobileDevice() {
            return window.innerWidth < 768;
        }
        
        // State management
        let isPaused = false;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let scrollLeft = 0;
        let currentScrollPosition = 0;
        let animationFrameId = null;
        let lastTapTime = 0;
        let tapTimeout = null;
        
        // Get current transform value from CSS
        function getCurrentTransform() {
            const transform = window.getComputedStyle(scrollTrack).transform;
            if (transform === 'none') return 0;
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            return matrix ? parseFloat(matrix[1].split(',')[4]) : 0;
        }
        
        // Set transform value
        function setTransform(value, disableTransition = false) {
            if (disableTransition) {
                scrollTrack.style.transition = 'none';
            } else {
                scrollTrack.style.transition = '';
            }
            scrollTrack.style.transform = `translateX(${value}px)`;
            currentScrollPosition = value;
        }
        
        // Calculate total scroll width (one set of cards)
        function getScrollWidth() {
            const cardWidth = window.innerWidth < 768 ? 320 : 450;
            const gap = window.innerWidth < 768 ? 16 : 24;
            return (cardWidth + gap) * 8; // 8 cards per set
        }
        
        // -------------------------
        // AUTO SCROLL ANIMATION (requestAnimationFrame)
        // -------------------------
        function startAutoScroll() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            const speed = 0.6; // pixels per frame (adjust for speed)
            const scrollWidth = getScrollWidth();
            
            function animate() {
                // Only run if mobile, not paused, and not dragging
                if (!isMobileDevice() || isPaused || isDragging) {
                    animationFrameId = null;
                    return;
                }
                
                // Increment scroll position
                currentScrollPosition -= speed;
                
                // Loop back for infinite scroll effect
                if (Math.abs(currentScrollPosition) >= scrollWidth) {
                    currentScrollPosition = 0;
                }
                
                // Apply transform
                setTransform(currentScrollPosition);
                
                // Continue animation
                animationFrameId = requestAnimationFrame(animate);
            }
            
            // Start animation
            animationFrameId = requestAnimationFrame(animate);
        }
        
        // Stop auto scroll
        function stopAutoScroll() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
        
        // -------------------------
        // TOUCH DRAG HANDLING
        // -------------------------
        function handleTouchStart(e) {
            if (!isMobileDevice()) return;
            
            const touch = e.touches[0];
            isDragging = true;
            startX = touch.pageX;
            startY = touch.pageY;
            scrollLeft = getCurrentTransform();
            
            // Stop auto-scroll during drag
            stopAutoScroll();
        }
        
        function handleTouchMove(e) {
            if (!isMobileDevice() || !isDragging) return;
            
            const touch = e.touches[0];
            const currentX = touch.pageX;
            const currentY = touch.pageY;
            const diffX = currentX - startX;
            const diffY = Math.abs(currentY - startY);
            
            // Only handle horizontal scrolling if horizontal movement is greater
            if (Math.abs(diffX) > diffY) {
                e.preventDefault();
                
                // Calculate new scroll position with sensitivity
                const walk = diffX * 1.5; // scroll sensitivity multiplier
                const newScrollLeft = scrollLeft - walk;
                
                // Apply manual scroll (disable transition during drag for smoothness)
                setTransform(newScrollLeft, true);
            }
        }
        
        function handleTouchEnd(e) {
            if (!isMobileDevice() || !isDragging) return;
            
            isDragging = false;
            
            // Re-enable transitions after drag
            scrollTrack.style.transition = '';
            
            // Check if this was a tap (minimal movement)
            const touch = e.changedTouches[0];
            const diffX = Math.abs(touch.pageX - startX);
            const diffY = Math.abs(touch.pageY - startY);
            const isTap = diffX < 10 && diffY < 10;
            
            if (isTap) {
                // Handle tap to pause/resume
                handleTap();
            } else {
                // Resume auto-scroll after drag (if not paused)
                if (!isPaused) {
                    // Update scrollLeft to current position for next drag
                    scrollLeft = getCurrentTransform();
                    currentScrollPosition = scrollLeft;
                    startAutoScroll();
                }
            }
        }
        
        function handleTouchCancel(e) {
            if (!isMobileDevice()) return;
            
            isDragging = false;
            
            // Re-enable transitions after drag
            scrollTrack.style.transition = '';
            
            // Resume auto-scroll if not paused
            if (!isPaused) {
                scrollLeft = getCurrentTransform();
                currentScrollPosition = scrollLeft;
                startAutoScroll();
            }
        }
        
        // -------------------------
        // TAP TO PAUSE / RESUME
        // -------------------------
        function handleTap() {
            if (!isMobileDevice()) return;
            
            // Debounce rapid taps
            const currentTime = Date.now();
            if (currentTime - lastTapTime < 300) {
                return;
            }
            lastTapTime = currentTime;
            
            // Toggle pause state
            isPaused = !isPaused;
            
            if (isPaused) {
                // Pause: stop auto-scroll
                stopAutoScroll();
            } else {
                // Resume: start auto-scroll from current position
                scrollLeft = getCurrentTransform();
                startAutoScroll();
            }
        }
        
        // -------------------------
        // INITIALIZATION
        // -------------------------
        
        // Desktop: Use CSS animation (do nothing, CSS handles it)
        if (!isMobileDevice()) {
            // Ensure CSS animation is running on desktop
            scrollTrack.style.animationPlayState = 'running';
            return;
        }
        
        // Mobile: Disable CSS animation and use JavaScript
        scrollTrack.style.animation = 'none';
        scrollTrack.style.animationPlayState = 'paused';
        
        // Initialize scroll position
        currentScrollPosition = 0;
        setTransform(0);
        
        // Add event listeners for touch
        scrollWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        scrollWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        scrollWrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
        scrollWrapper.addEventListener('touchcancel', handleTouchCancel, { passive: true });
        
        // Enable smooth touch scrolling
        scrollWrapper.style.webkitOverflowScrolling = 'touch';
        scrollWrapper.style.touchAction = 'pan-x';
        
        // Start auto-scroll on mobile
        startAutoScroll();
        
        // Handle window resize (switch between mobile/desktop modes)
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                // Stop current animation
                stopAutoScroll();
                
                if (isMobileDevice()) {
                    // Switch to mobile mode
                    scrollTrack.style.animation = 'none';
                    scrollTrack.style.animationPlayState = 'paused';
                    currentScrollPosition = getCurrentTransform();
                    if (!isPaused) {
                        startAutoScroll();
                    }
                } else {
                    // Switch to desktop mode
                    scrollTrack.style.animation = '';
                    scrollTrack.style.animationPlayState = 'running';
                    scrollTrack.style.transform = '';
                    // Remove touch listeners (they'll be re-added if needed)
                }
            }, 250);
        });
    }
})();
