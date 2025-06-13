// Slider JavaScript
let currentIndex = 0;
const totalSlides = 6;
let autoPlayInterval;
let isAutoPlaying = true;
const container = document.getElementById('itemContainer');
const dots = document.querySelectorAll('.dot');
const playPauseBtn = document.querySelector('.play-pause-btn');

function updateSlider() {
    const translateX = -currentIndex * 100;
    container.style.transform = `translateX(${translateX}%)`;
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}

function nextImage() {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlider();
}

function prevImage() {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlider();
}

function goToSlide(index) {
    currentIndex = index;
    updateSlider();
}

function startAutoPlay() {
    autoPlayInterval = setInterval(nextImage, 4000);
    isAutoPlaying = true;
    if (playPauseBtn) {
        playPauseBtn.textContent = '⏸';
    }
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
    isAutoPlaying = false;
    if (playPauseBtn) {
        playPauseBtn.textContent = '▶';
    }
}

function toggleAutoPlay() {
    if (isAutoPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevImage();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === ' ') {
            e.preventDefault();
            toggleAutoPlay();
        }
    });

    // Touch/swipe support
    let startX = 0;
    let endX = 0;

    if (container) {
        container.addEventListener('touchstart', function(e) {
            startX = e.touches[0].clientX;
        });

        container.addEventListener('touchend', function(e) {
            endX = e.changedTouches[0].clientX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }
    }

    // Pause auto-play on hover
    const gallery = document.querySelector('.tv-plus-gallery');
    if (gallery) {
        gallery.addEventListener('mouseenter', stopAutoPlay);
        gallery.addEventListener('mouseleave', function() {
            if (isAutoPlaying) startAutoPlay();
        });
    }

    // Start auto-play and initialize
    startAutoPlay();
    updateSlider();
});