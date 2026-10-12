/* Load the public shop-hours gate on pages using the lightweight shared script. */
(function loadKavroShopHours() {
    if (document.querySelector('script[data-kavro-shop-hours]')) return;
    const gateScript = document.createElement("script");
    gateScript.src = "assets/js/shop-hours.js";
    gateScript.dataset.kavroShopHours = "true";
    document.head.appendChild(gateScript);
})();

/* Kavro lightweight UI interactions */

document.addEventListener("DOMContentLoaded", () => {
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
