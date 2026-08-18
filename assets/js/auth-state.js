document.addEventListener("DOMContentLoaded", function () {

    const signUpBtn = document.getElementById("signUpBtn");
    const signInBtn = document.getElementById("signInBtn");
    const profileBtn = document.getElementById("profileBtn");
    const logoutBtn = document.getElementById("navLogoutBtn");

    const token = localStorage.getItem("token");

    if (token) {

        // Hide Sign Up and Sign In
        if (signUpBtn) {
            signUpBtn.style.setProperty("display", "none", "important");
        }

        if (signInBtn) {
            signInBtn.style.setProperty("display", "none", "important");
        }

        // Show Profile and Logout
        if (profileBtn) {
            profileBtn.style.setProperty("display", "flex", "important");
        }

        if (logoutBtn) {
            logoutBtn.style.setProperty("display", "block", "important");
        }

    } else {

        // Show Sign Up and Sign In
        if (signUpBtn) {
            signUpBtn.style.setProperty("display", "", "important");
        }

        if (signInBtn) {
            signInBtn.style.setProperty("display", "", "important");
        }

        // Hide Profile and Logout
        if (profileBtn) {
            profileBtn.style.setProperty("display", "none", "important");
        }

        if (logoutBtn) {
            logoutBtn.style.setProperty("display", "none", "important");
        }
    }

});


function kavroLogout() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");

    window.location.href = "index.html";
}