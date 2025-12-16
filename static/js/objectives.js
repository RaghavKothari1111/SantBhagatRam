/**
 * Auto-Scrolling Objectives Carousel (Unified Mobile & Desktop)
 * 
 * Features:
 * - Auto-scrolls continuously left-to-right using requestAnimationFrame
 * - Drag-to-scroll (Touch & Mouse)
 * - Two-finger horizontal scrolling (Trackpad)
 * - Pause on Hover (Desktop) & Pause on Tap (Mobile)
 * - Starts auto-scrolling immediately on page load
 */

(function () {
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

        // State management
        let isPaused = false;
        let isDragging = false;
        let isHorizontalDrag = false;

        let startX = 0;
        let startY = 0;
        let scrollLeftStart = 0;

        let animationFrameId = null;

        // Threshold for determining horizontal vs vertical gesture
        const HORIZONTAL_THRESHOLD = 8;

        // Wheel event throttling
        let isWheeling = false;
        let wheelTimeout = null;

        // -------------------------
        // AUTO SCROLL ANIMATION
        // -------------------------
        function startAutoScroll() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            // Device-specific speeds: faster on desktop (cards are wider), moderate on mobile
            const isMobile = window.innerWidth <= 768;
            const speed = isMobile ? 1.2 : 3.5; // pixels per frame

            function animate() {
                if (isPaused || isDragging || isWheeling) {
                    animationFrameId = null;
                    return;
                }

                const currentPos = getCurrentScrollPosition();
                let newPos = currentPos - speed;
                newPos = enforceInfiniteLoop(newPos);
                setTransform(newPos);

                animationFrameId = requestAnimationFrame(animate);
            }

            animationFrameId = requestAnimationFrame(animate);
        }

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

        // Calculate total scroll width
        function getScrollWidth() {
            const cards = scrollTrack.querySelectorAll('.objective-card');
            if (cards.length === 0) return 0;
            const cardsPerSet = cards.length / 2;
            let totalWidth = 0;
            const gap = window.innerWidth < 768 ? 16 : 24;
            const paddingLeft = window.innerWidth < 768 ? 16 : 24;

            if (cards[0]) {
                const cardRect = cards[0].getBoundingClientRect();
                const cardWidth = cardRect.width;
                totalWidth = (cardWidth + gap) * cardsPerSet - gap + paddingLeft;
            }
            return totalWidth;
        }

        // Enforce Infinite Loop
        function enforceInfiniteLoop(position) {
            const totalWidth = getScrollWidth();
            if (totalWidth === 0) return position;

            let scrollLeftEquivalent = -position;
            while (scrollLeftEquivalent >= totalWidth) {
                scrollLeftEquivalent -= totalWidth;
            }
            while (scrollLeftEquivalent < 0) {
                scrollLeftEquivalent += totalWidth;
            }
            return -scrollLeftEquivalent;
        }

        // Initialize Position
        function initializeInfiniteLoopPosition() {
            setTimeout(() => {
                const totalWidth = getScrollWidth();
                if (totalWidth === 0) {
                    setTimeout(initializeInfiniteLoopPosition, 100);
                    return;
                }
                setTransform(0, true);
            }, 50);
        }

        // -------------------------
        // DRAG HANDLERS (Touch & Mouse)
        // -------------------------
        function handleDragStart(e) {
            const pageX = e.touches ? e.touches[0].pageX : e.pageX;
            const pageY = e.touches ? e.touches[0].pageY : e.pageY;
            const rect = scrollWrapper.getBoundingClientRect();

            isDragging = true;
            isHorizontalDrag = false;

            startX = pageX - rect.left;
            startY = pageY;
            scrollLeftStart = getCurrentScrollPosition();

            stopAutoScroll();

            if (!e.touches) {
                e.preventDefault();
            }
        }

        function handleDragMove(e) {
            if (!isDragging) return;

            const pageX = e.touches ? e.touches[0].pageX : e.pageX;
            const pageY = e.touches ? e.touches[0].pageY : e.pageY;
            const rect = scrollWrapper.getBoundingClientRect();

            const dx = (pageX - rect.left) - startX;
            const dy = pageY - startY;

            if (e.touches && !isHorizontalDrag) {
                if (Math.abs(dx) > Math.abs(dy) + HORIZONTAL_THRESHOLD) {
                    isHorizontalDrag = true;
                } else if (Math.abs(dy) >= Math.abs(dx)) {
                    isDragging = false;
                    if (!isPaused) startAutoScroll();
                    return;
                } else {
                    return;
                }
            }

            e.preventDefault();

            const walk = dx * 1.5;
            let newScrollLeft = scrollLeftStart + walk;
            newScrollLeft = enforceInfiniteLoop(newScrollLeft);
            setTransform(newScrollLeft, true);
        }

        function handleDragEnd(e) {
            if (!isDragging) return;

            scrollTrack.style.transition = '';
            isDragging = false;
            isHorizontalDrag = false;

            const finalPos = getCurrentScrollPosition();
            const loopedPos = enforceInfiniteLoop(finalPos);
            if (loopedPos !== finalPos) {
                setTransform(loopedPos, true);
            }

            if (!isPaused) {
                // Only check for hover if the device actually supports hovering (Desktop)
                // This prevents sticky hover states on mobile from blocking resume
                const supportsHover = window.matchMedia('(hover: hover)').matches;

                if (!e.touches && supportsHover && scrollWrapper.matches(':hover')) {
                    // Do nothing, wait for mouseleave
                } else {
                    startAutoScroll();
                }
            }
        }

        // -------------------------
        // WHEEL HANDLER (Trackpad)
        // -------------------------
        function handleWheel(e) {
            if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;

            e.preventDefault();

            isWheeling = true;
            stopAutoScroll();

            if (wheelTimeout) clearTimeout(wheelTimeout);

            const currentPos = getCurrentScrollPosition();
            const delta = e.deltaX * 1.2;
            let newPos = currentPos - delta;

            newPos = enforceInfiniteLoop(newPos);
            setTransform(newPos, true);

            wheelTimeout = setTimeout(() => {
                isWheeling = false;
                if (!isPaused) {
                    if (scrollWrapper.matches(':hover')) {
                        // Wait for mouseleave
                    } else {
                        startAutoScroll();
                    }
                }
            }, 100);
        }

        // -------------------------
        // HOVER & TAP HANDLERS
        // -------------------------
        function handleMouseEnter() {
            // Only pause on hover if device actually supports hover
            if (!window.matchMedia('(hover: hover)').matches) return;

            isPaused = true;
            stopAutoScroll();
            if (wheelTimeout) clearTimeout(wheelTimeout);
            isWheeling = false;
        }

        function handleMouseLeave() {
            // Only resume on leave if device supports hover
            if (!window.matchMedia('(hover: hover)').matches) return;

            isPaused = false;
            if (!isDragging && !isWheeling) {
                startAutoScroll();
            }
        }

        function handleTap() {
            isPaused = !isPaused;
            if (isPaused) stopAutoScroll();
            else startAutoScroll();
        }

        // -------------------------
        // INITIALIZATION & EVENTS
        // -------------------------

        scrollTrack.style.animation = 'none';

        // Touch Events
        scrollWrapper.addEventListener('touchstart', handleDragStart, { passive: false });
        scrollWrapper.addEventListener('touchmove', handleDragMove, { passive: false });
        scrollWrapper.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            const rect = scrollWrapper.getBoundingClientRect();
            const diffX = Math.abs((touch.pageX - rect.left) - startX);
            const diffY = Math.abs(touch.pageY - startY);

            if (diffX < 25 && diffY < 25 && !isHorizontalDrag) {
                handleTap();
            }
            handleDragEnd(e);
        }, { passive: true });
        scrollWrapper.addEventListener('touchcancel', handleDragEnd, { passive: true });

        // Mouse Events
        scrollWrapper.addEventListener('mousedown', handleDragStart);
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);

        // Hover Events
        scrollWrapper.addEventListener('mouseenter', handleMouseEnter);
        scrollWrapper.addEventListener('mouseleave', handleMouseLeave);

        // Wheel Event
        scrollWrapper.addEventListener('wheel', handleWheel, { passive: false });

        // Initial Setup
        initializeInfiniteLoopPosition();
        startAutoScroll();

        // Resize Handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                stopAutoScroll();
                if (!isPaused) startAutoScroll();
            }, 200);
        });
    }
})();
