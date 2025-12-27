/**
 * Drag to Scroll functionality for horizontal scrolling containers
 * Enables mouse dragging to scroll on desktop devices for a "touch-like" experience
 */
document.addEventListener('DOMContentLoaded', function () {
    // Select all elements that should have drag-to-scroll functionality
    // Specifically targeting the home-blog-grid but made generic for reuse
    const sliders = document.querySelectorAll('.home-blog-grid');

    sliders.forEach(slider => {
        let isDown = false;
        let startX;
        let scrollLeft;
        let isDragging = false;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            slider.classList.add('active'); // You can add cursor: grabbing in CSS for this class
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;

            // Cancel default behavior to prevent text selection during drag
            // but we need to be careful not to block link clicks if not dragging
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            isDragging = false;
            slider.classList.remove('active');
        });

        slider.addEventListener('mouseup', (e) => {
            isDown = false;
            slider.classList.remove('active');

            // If we were dragging, prevent the default click action on links
            if (isDragging) {
                const links = e.target.closest('a');
                if (links) {
                    const clickHandler = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        links.removeEventListener('click', clickHandler);
                    };
                    links.addEventListener('click', clickHandler);
                }
            }
            isDragging = false;
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();

            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll-fast multiplier

            // Check if we've moved enough to consider it a drag
            if (Math.abs(walk) > 5) {
                isDragging = true;
            }

            slider.scrollLeft = scrollLeft - walk;
        });
    });
});
