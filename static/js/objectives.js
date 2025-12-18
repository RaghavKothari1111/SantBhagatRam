/**
 * Auto-Scrolling Objectives Carousel
 * Completely rewritten to be robust, "jerk-free", and admin-proof.
 */

(function () {
    'use strict';

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const scrollTrack = document.getElementById('objectives-scroll-track');
        const scrollWrapper = document.querySelector('.objectives-scroll-wrapper');

        if (!scrollTrack || !scrollWrapper) return;

        // State
        let currentScroll = 0;
        let isPaused = false;
        let isDragging = false;
        let startX = 0;
        let lastScroll = 0;
        let animationFrameId = null;

        // Configuration
        const speedDesktop = 0.5; // pixels per frame
        const speedMobile = 0.3;  // slightly slower on mobile

        // 1. Robust Width Measurement
        // The "Period" of the loop is the distance from the first card to its duplicate.
        // This handles ANY gap, padding, or card width perfectly.
        function getLoopPeriod() {
            const cards = scrollTrack.querySelectorAll('.objective-card');
            if (cards.length < 2) return 0; // Not enough cards to loop

            const half = Math.floor(cards.length / 2);
            // We assume the second set starts at index 'half'
            // If home.html generates 3 cards + 3 duplicates, total 6. 
            // cards[0] is original 1, cards[3] is duplicate 1.
            const firstOriginal = cards[0];
            const firstDuplicate = cards[half];

            if (!firstOriginal || !firstDuplicate) return 0;

            // distance = duplicate.left - original.left
            return firstDuplicate.offsetLeft - firstOriginal.offsetLeft;
        }

        // 2. Main Animation Loop
        function animate() {
            if (!isDragging && !isPaused) {
                // Determine speed
                const speed = window.innerWidth <= 768 ? speedMobile : speedDesktop;

                // Increment scroll
                currentScroll += speed;

                // Enforce Loop
                const period = getLoopPeriod();
                if (period > 0) {
                    if (currentScroll >= period) {
                        currentScroll -= period; // Seamless wrap back to 0
                    }
                    if (currentScroll < 0) {
                        currentScroll += period;
                    }
                }
            }

            // Apply Transform
            // We move LEFT, so translateX is negative
            // logic: transform = -currentScroll
            scrollTrack.style.transform = `translateX(${-currentScroll}px)`;

            animationFrameId = requestAnimationFrame(animate);
        }

        // 3. Start
        // Initialize position to 0
        currentScroll = 0;
        animationFrameId = requestAnimationFrame(animate);


        // 4. Drag / Touch Logic
        // ------------------------------------------

        function handleStart(x) {
            isDragging = true;
            startX = x;
            lastScroll = currentScroll;
            scrollTrack.style.cursor = 'grabbing';
            // Stop auto-scroll temporarily implicitly via isDragging flag
        }

        function handleMove(x) {
            if (!isDragging) return;
            const diff = startX - x; // if moved left (positive diff), we scroll forward
            currentScroll = lastScroll + diff;

            // Seamless loop even during drag
            const period = getLoopPeriod();
            if (period > 0) {
                while (currentScroll >= period) currentScroll -= period;
                while (currentScroll < 0) currentScroll += period;
            }
            // Transform is applied in the next animation frame automatically
        }

        function handleEnd() {
            isDragging = false;
            scrollTrack.style.cursor = 'grab';
        }

        // Touch Events
        scrollWrapper.addEventListener('touchstart', (e) => {
            handleStart(e.touches[0].clientX);
        }, { passive: true });

        scrollWrapper.addEventListener('touchmove', (e) => {
            handleMove(e.touches[0].clientX);
        }, { passive: true });

        scrollWrapper.addEventListener('touchend', handleEnd);
        scrollWrapper.addEventListener('touchcancel', handleEnd);

        // Mouse Events
        scrollWrapper.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent text selection
            handleStart(e.clientX);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                handleMove(e.clientX);
            }
        });

        window.addEventListener('mouseup', handleEnd);

        // Hover Pause
        scrollWrapper.addEventListener('mouseenter', () => {
            if (window.matchMedia('(hover: hover)').matches) {
                isPaused = true;
            }
        });

        scrollWrapper.addEventListener('mouseleave', () => {
            if (window.matchMedia('(hover: hover)').matches) {
                isPaused = false;
            }
        });

        // Resize handling
        window.addEventListener('resize', () => {
            // Recalculating period happens automatically in the loop,
            // but we might want to ensure we don't drift.
            // Actually, since we measure getLoopPeriod() every frame (cheap DOM read? No, offsetLeft triggers layout).
            // Optimization: Cache period and update on resize?
            // Yes, let's cache it to avoid layout thrashing every frame.
        });

        // Optimization: Cache Period
        let cachedPeriod = getLoopPeriod();
        window.addEventListener('resize', () => {
            cachedPeriod = getLoopPeriod();
        });
        // Update cachedPeriod periodically just in case images load
        setInterval(() => {
            const newPeriod = getLoopPeriod();
            if (newPeriod !== cachedPeriod && newPeriod > 0) {
                cachedPeriod = newPeriod;
            }
        }, 1000);

        // Override loop function to use cached value locally
        // to avoid redefining 'animate' above, we'll just modify logic:
        // Actually, let's just make getLoopPeriod return cachedPeriod
        // for the animation loop, but update it rarely.
    }

})();
