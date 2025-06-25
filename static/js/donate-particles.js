document.addEventListener("DOMContentLoaded", () => {
  const donateBtn = document.querySelector(".gooey-donate");
  if (!donateBtn) {
    console.log("Donate button not found");
    return;
  }

  const effectContainer = donateBtn.querySelector(".gooey-effect");

  donateBtn.addEventListener("mouseenter", () => {
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement("span");
      const x = (Math.random() - 0.5) * 120 + "px";
      const y = (Math.random() - 0.5) * 120 + "px";
      particle.style.setProperty("--x", x);
      particle.style.setProperty("--y", y);
      effectContainer.appendChild(particle);

      particle.addEventListener("animationend", () => {
        particle.remove();
      });
    }
  });
});
