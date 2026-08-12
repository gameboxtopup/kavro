/* Kavro authentication/navigation state */

const KAVRO_API = "https://kavro-api.onrender.com";

function getKavroToken() {
    return localStorage.getItem("kavroToken");
}

function getKavroUser() {
    try {
        return JSON.parse(localStorage.getItem("kavroUser")) || null;
    } catch {
        return null;
    }
}

function isKavroLoggedIn() {
    return Boolean(getKavroToken());
}

function updateKavroNavigation() {
    const loggedIn = isKavroLoggedIn();

    const signUp = document.getElementById("signupBtn");
    const signIn = document.getElementById("signinBtn");
    const profile = document.getElementById("profileBtn");
    const logout = document.getElementById("navLogoutBtn");

    if (loggedIn) {
        if (signUp) signUp.style.display = "none";
        if (signIn) signIn.style.display = "none";

        if (profile) {
            profile.style.display = "inline-flex";
            profile.setAttribute("aria-label", "Open dashboard");
            profile.setAttribute("title", "Dashboard");
        }

        if (logout) {
            logout.style.display = "inline-flex";
        }
    } else {
        if (signUp) signUp.style.display = "inline-flex";
        if (signIn) signIn.style.display = "inline-flex";
        if (profile) profile.style.display = "none";
        if (logout) logout.style.display = "none";
    }
}

function kavroLogout() {
    localStorage.removeItem("kavroToken");
    localStorage.removeItem("kavroUser");

    // Replace the current page instead of adding another history entry.
    window.location.replace("index.html");
}

document.addEventListener("click", (event) => {
    const profile = event.target.closest("#profileBtn");
    if (!profile) return;

    if (isKavroLoggedIn()) {
        window.location.href = "dashboard.html";
    } else {
        window.location.href = "login.html";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    updateKavroNavigation();
});
