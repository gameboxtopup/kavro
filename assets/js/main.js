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
