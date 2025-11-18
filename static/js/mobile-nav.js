/**
 * Apple-Style Mobile Navigation Menu
 * Handles sliding menu from left with submenu navigation
 */

document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("mobileNavOverlay");
    const toggle = document.getElementById("mobileNavToggle");
    const closeBtn = document.getElementById("mobileNavClose");

    if (!overlay || !toggle || !closeBtn) {
        return; // Exit if elements don't exist (desktop view)
    }

    const panels = overlay.querySelectorAll(".mobile-nav-panel");
    const rootPanel = overlay.querySelector('[data-panel="root"]');

    function openOverlay() {
        overlay.classList.add("is-open");
        document.body.classList.add("menu-open");
    }

    function closeOverlay() {
        overlay.classList.remove("is-open");
        document.body.classList.remove("menu-open");
        // Reset to root
        panels.forEach(p => p.classList.remove("is-active", "slide-left"));
        if (rootPanel) rootPanel.classList.add("is-active");
    }

    // Open menu
    toggle.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        openOverlay();
    });
    
    // Also support touch events
    toggle.addEventListener("touchend", function(e) {
        e.preventDefault();
        e.stopPropagation();
        openOverlay();
    });

    // Close menu
    closeBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeOverlay();
    });

    // Close menu when clicking outside (on overlay background)
    overlay.addEventListener("click", function(e) {
        if (e.target === overlay) {
            closeOverlay();
        }
    });

    // Open submenu
    overlay.querySelectorAll("[data-panel-target]").forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const target = btn.getAttribute("data-panel-target");
            const targetPanel = overlay.querySelector(`[data-panel="${target}"]`);
            
            if (!targetPanel || !rootPanel) return;

            rootPanel.classList.add("slide-left");
            targetPanel.classList.add("is-active");
            targetPanel.classList.remove("slide-left");
        });
    });

    // Back buttons
    overlay.querySelectorAll("[data-back]").forEach(backBtn => {
        backBtn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            panels.forEach(p => p.classList.remove("is-active", "slide-left"));
            if (rootPanel) rootPanel.classList.add("is-active");
        });
    });

    // Handle language toggle in mobile menu
    const languageBtnMobile = document.getElementById("languageBtnMobile");
    if (languageBtnMobile) {
        languageBtnMobile.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Trigger the same language toggle as desktop
            const languageBtn = document.getElementById("languageBtn");
            if (languageBtn) {
                languageBtn.click();
            }
        });
    }

    // Close menu on escape key
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) {
            closeOverlay();
        }
    });

    // Handle window resize
    window.addEventListener("resize", function() {
        if (window.innerWidth > 767) {
            closeOverlay();
        }
    });
});

