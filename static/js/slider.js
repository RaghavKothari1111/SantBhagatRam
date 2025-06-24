let currentIndex = 0;
const totalSlides = 6;
let autoPlayInterval;
let isAutoPlaying = true;
const container = document.getElementById('itemContainer');
const dots = document.querySelectorAll('.dot');
const playPauseIcon = document.getElementById('playPauseIcon');

function updateSlider() {
    const translateX = -currentIndex * 100;
    container.style.transform = `translateX(${translateX}%)`;

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}

let isSliding = false;
function nextImage() {
    if (isSliding) return;
    isSliding = true;

    currentIndex = (currentIndex + 1) % totalSlides;
    updateSlider();

    setTimeout(() => {
        isSliding = false;
    }, 500);
}

function prevImage() {
    if (isSliding) return;
    isSliding = true;

    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateSlider();

    setTimeout(() => {
        isSliding = false;
    }, 500);
}

function goToSlide(index) {
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

document.addEventListener('DOMContentLoaded', function () {
    updateSlider();
    startAutoPlay();

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

    // Touch support
    let startX = 0;
    let endX = 0;

    if (container) {
        container.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
        });

        container.addEventListener('touchend', function (e) {
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

    // Delay enabling hover pause to avoid accidental stop on load
    let hoverPauseEnabled = false;
    setTimeout(() => {
        hoverPauseEnabled = true;
    }, 1000); // delay in ms

    const gallery = document.querySelector('.tv-plus-gallery');
    if (gallery) {
        gallery.addEventListener('mouseenter', () => {
            if (hoverPauseEnabled) stopAutoPlay();
        });
        gallery.addEventListener('mouseleave', () => {
            if (hoverPauseEnabled && !isAutoPlaying) {
                startAutoPlay();
            }
        });
    }
});

const scroller = document.querySelector('.objectives-scroller');
scroller.addEventListener('mouseover', () => {
    document.querySelector('.objectives-list').style.animationPlayState = 'paused';
});
scroller.addEventListener('mouseout', () => {
    document.querySelector('.objectives-list').style.animationPlayState = 'running';
});
