/* Kavro lightweight UI interactions */

document.addEventListener("DOMContentLoaded", () => {
    const shopHours = document.createElement("script");
shopHours.src = "/assets/js/shop-hours.js?v=1";
document.head.appendChild(shopHours);
    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {
        menuBtn.addEventListener("click", () => {
            navLinks.classList.toggle("open");
            menuBtn.setAttribute(
                "aria-expanded",
                navLinks.classList.contains("open") ? "true" : "false"
            );
        });

        document.addEventListener("click", (event) => {
            if (
                !navLinks.contains(event.target) &&
                !menuBtn.contains(event.target)
            ) {
                navLinks.classList.remove("open");
                menuBtn.setAttribute("aria-expanded", "false");
            }
        });
    }
});
