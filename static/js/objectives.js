/**
 * Auto-Scrolling Objectives Carousel (Mobile)
 * 
 * Features:
 * - Auto-scrolls continuously left-to-right on mobile (<768px) using requestAnimationFrame
 * - Horizontal swipe: items move in same direction as finger (natural feel)
 * - Vertical page scrolling works normally even when finger is over objectives
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
        let isHorizontalDrag = false; // Track if gesture is confirmed horizontal
        
        let startX = 0;
        let startY = 0;
        let scrollLeftStart = 0;
        
        let animationFrameId = null;
        let lastTapTime = 0;
        
        // Threshold for determining horizontal vs vertical gesture
        const HORIZONTAL_THRESHOLD = 8; // pixels
        
        // -------------------------
        // AUTO SCROLL ANIMATION (requestAnimationFrame)
        // -------------------------
        function startAutoScroll() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            
            if (!isMobileDevice()) return;
            
            const speed = 0.6; // pixels per frame (adjust for speed)
            
            function animate() {
                // Only run if mobile, not paused, and not dragging
                if (!isMobileDevice() || isPaused || isDragging) {
                    animationFrameId = null;
                    return;
                }
                
                // Get the scroll container (we'll use scrollLeft for better compatibility)
                // Since we're using transform, we need to track position manually
                const currentPos = getCurrentScrollPosition();
                
                // Decrement scroll position (move right-to-left, negative direction)
                let newPos = currentPos - speed;
                
                // Enforce infinite loop in both directions
                newPos = enforceInfiniteLoop(newPos);
                
                // Apply transform
                setTransform(newPos);
                
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
        
        // Get current scroll position from transform
        function getCurrentScrollPosition() {
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
        }
        
        // Calculate total scroll width (one set of cards) - dynamically
        function getScrollWidth() {
            const cards = scrollTrack.querySelectorAll('.objective-card');
            if (cards.length === 0) return 0;
            
            // Get the number of cards in the first set (half of total, since we duplicate)
            const cardsPerSet = cards.length / 2;
            
            // Calculate actual width by measuring the first set
            let totalWidth = 0;
            const gap = window.innerWidth < 768 ? 16 : 24;
            const paddingLeft = window.innerWidth < 768 ? 16 : 24;
            
            // Measure first card to get actual width
            if (cards[0]) {
                const cardRect = cards[0].getBoundingClientRect();
                const cardWidth = cardRect.width;
                totalWidth = (cardWidth + gap) * cardsPerSet - gap + paddingLeft;
            }
            
            return totalWidth;
        }
        
        // -------------------------
        // INFINITE LOOP ENFORCEMENT (Both Directions)
        // -------------------------
        function enforceInfiniteLoop(position) {
            const totalWidth = getScrollWidth(); // Width of one set (items are duplicated)
            if (totalWidth === 0) return position; // Safety check
            
            // Convert transform position to scrollLeft equivalent for logic
            // transform: translateX(-value) means content moved left by value
            // scrollLeft = value means scrolled right by value
            // So: scrollLeft equivalent = -position
            
            let scrollLeftEquivalent = -position;
            
            // Wrap around when we reach the end of first set
            // When scrollLeftEquivalent >= totalWidth, we've scrolled past the first set
            // Jump back by subtracting totalWidth (the duplicate set is already visible)
            while (scrollLeftEquivalent >= totalWidth) {
                scrollLeftEquivalent -= totalWidth;
            }
            
            // Wrap around when we go before the start
            // When scrollLeftEquivalent < 0, jump forward by adding totalWidth
            while (scrollLeftEquivalent < 0) {
                scrollLeftEquivalent += totalWidth;
            }
            
            // Convert back to transform position
            return -scrollLeftEquivalent;
        }
        
        // -------------------------
        // INITIALIZE INFINITE LOOP POSITION
        // -------------------------
        function initializeInfiniteLoopPosition() {
            // Wait a bit for layout to settle, then calculate
            setTimeout(() => {
                const totalWidth = getScrollWidth(); // Width of one set (items are duplicated)
                if (totalWidth === 0) {
                    // Retry if width not calculated yet
                    setTimeout(initializeInfiniteLoopPosition, 100);
                    return;
                }
                // Start at the beginning of first set (position 0)
                // This ensures seamless loop when we reach the end
                setTransform(0, true);
            }, 50);
        }
        
        // -------------------------
        // TOUCH HANDLERS
        // -------------------------
        function handleTouchStart(e) {
            if (!isMobileDevice()) return;
            
            const touch = e.touches[0];
            const rect = scrollWrapper.getBoundingClientRect();
            
            isDragging = true;
            isHorizontalDrag = false; // We don't know yet if it's horizontal or vertical
            
            // Calculate relative position
            startX = touch.pageX - rect.left;
            startY = touch.pageY;
            scrollLeftStart = getCurrentScrollPosition();
            
            // Stop auto-scroll during drag
            stopAutoScroll();
        }
        
        function handleTouchMove(e) {
            if (!isMobileDevice() || !isDragging) return;
            
            const touch = e.touches[0];
            const rect = scrollWrapper.getBoundingClientRect();
            
            const x = touch.pageX - rect.left;
            const y = touch.pageY;
            
            const dx = x - startX;
            const dy = y - startY;
            
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            
            // Decide if this gesture is horizontal or vertical
            if (!isHorizontalDrag) {
                // Check if horizontal movement is significantly greater than vertical
                if (absDx > absDy + HORIZONTAL_THRESHOLD) {
                    // Confirmed horizontal swipe
                    isHorizontalDrag = true;
                } else if (absDy >= absDx) {
                    // More vertical than horizontal -> let page scroll
                    isDragging = false;
                    isHorizontalDrag = false;
                    // Resume auto-scroll if not paused
                    if (!isPaused) {
                        startAutoScroll();
                    }
                    return; // Don't prevent default, allow vertical scroll
                } else {
                    // Not enough movement yet, wait for more input
                    return;
                }
            }
            
            // If we are here, it's a confirmed horizontal drag -> prevent default to stop vertical scroll
            e.preventDefault();
            
            // FIX: Make direction feel natural
            // dx > 0 -> finger moved right -> content moves right (positive direction)
            // dx < 0 -> finger moved left -> content moves left (negative direction)
            const walk = dx * 1.5; // sensitivity multiplier
            let newScrollLeft = scrollLeftStart + walk; // Add (not subtract) for natural direction
            
            // Enforce infinite loop during drag (seamless teleport)
            newScrollLeft = enforceInfiniteLoop(newScrollLeft);
            
            // Apply manual scroll (disable transition during drag for smoothness)
            setTransform(newScrollLeft, true);
        }
        
        function handleTouchEnd(e) {
            if (!isMobileDevice() || !isDragging) return;
            
            // Re-enable transitions after drag
            scrollTrack.style.transition = '';
            
            // Check if this was a tap (minimal movement)
            const touch = e.changedTouches[0];
            const rect = scrollWrapper.getBoundingClientRect();
            const endX = touch.pageX - rect.left;
            const endY = touch.pageY;
            
            const diffX = Math.abs(endX - startX);
            const diffY = Math.abs(endY - startY);
            const isTap = diffX < 10 && diffY < 10 && !isHorizontalDrag;
            
            isDragging = false;
            isHorizontalDrag = false;
            
            // Enforce infinite loop one final time after drag ends (handles momentum/flick)
            const finalPos = getCurrentScrollPosition();
            const loopedPos = enforceInfiniteLoop(finalPos);
            if (loopedPos !== finalPos) {
                setTransform(loopedPos, true); // Instant teleport without transition
            }
            
            if (isTap) {
                // Handle tap to pause/resume
                handleTap();
            } else {
                // Resume auto-scroll after drag (if not paused)
                if (!isPaused) {
                    startAutoScroll();
                }
            }
        }
        
        function handleTouchCancel(e) {
            if (!isMobileDevice()) return;
            
            isDragging = false;
            isHorizontalDrag = false;
            
            // Re-enable transitions after drag
            scrollTrack.style.transition = '';
            
            // Enforce infinite loop after cancel (handles edge cases)
            const finalPos = getCurrentScrollPosition();
            const loopedPos = enforceInfiniteLoop(finalPos);
            if (loopedPos !== finalPos) {
                setTransform(loopedPos, true); // Instant teleport without transition
            }
            
            // Resume auto-scroll if not paused
            if (!isPaused) {
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
        
        // Initialize scroll position to middle (so we have items on both sides)
        initializeInfiniteLoopPosition();
        
        // Add event listeners for touch
        scrollWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        scrollWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        scrollWrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
        scrollWrapper.addEventListener('touchcancel', handleTouchCancel, { passive: true });
        
        // FIX: Set touchAction to "pan-y" to allow vertical page scrolling by default
        scrollWrapper.style.touchAction = 'pan-y';
        scrollWrapper.style.webkitOverflowScrolling = 'touch';
        
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
                    if (!isPaused) {
                        startAutoScroll();
                    }
                } else {
                    // Switch to desktop mode
                    scrollTrack.style.animation = '';
                    scrollTrack.style.animationPlayState = 'running';
                    scrollTrack.style.transform = '';
                }
            }, 250);
        });
    }
})();
