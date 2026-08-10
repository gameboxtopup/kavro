const KAVRO_API = "https://kavro-api.onrender.com";


// ==========================================
// TOKEN
// ==========================================

function getKavroToken() {
    return localStorage.getItem("kavroToken");
}


// ==========================================
// USER
// ==========================================

function getKavroUser() {
    try {
        return JSON.parse(
            localStorage.getItem("kavroUser")
        );
    } catch {
        return null;
    }
}


// ==========================================
// LOGIN CHECK
// ==========================================

function isKavroLoggedIn() {
    return !!getKavroToken();
}


// ==========================================
// LOGOUT
// ==========================================

function kavroLogout() {

    localStorage.removeItem("kavroToken");
    localStorage.removeItem("kavroUser");
    localStorage.removeItem("userId");

    // Return to homepage
    window.location.replace("index.html");
}


// ==========================================
// UPDATE NAVIGATION
// ==========================================

function updateKavroNavigation() {

    const loggedIn = isKavroLoggedIn();

    const signIn =
        document.getElementById("signInBtn");

    const signUp =
        document.getElementById("signUpBtn");

    const profile =
        document.getElementById("profileBtn");

    const logout =
        document.getElementById("navLogoutBtn");


    if (loggedIn) {

        // ------------------------------
        // HIDE SIGN IN / SIGN UP
        // ------------------------------

        if (signIn) {
            signIn.style.display = "none";
        }

        if (signUp) {
            signUp.style.display = "none";
        }


        // ------------------------------
        // SHOW PROFILE ICON
        // ------------------------------

        if (profile) {

            profile.style.display =
                "inline-flex";

            // IMPORTANT:
            // Never put user's name here.

            profile.innerHTML = "👤";

            profile.href =
                "dashboard.html";

        }


        // ------------------------------
        // SHOW LOGOUT
        // ------------------------------

        if (logout) {

            logout.style.display =
                "inline-flex";

        }

    } else {

        // ------------------------------
        // SHOW SIGN IN / SIGN UP
        // ------------------------------

        if (signIn) {
            signIn.style.display =
                "inline-flex";
        }

        if (signUp) {
            signUp.style.display =
                "inline-flex";
        }


        // ------------------------------
        // HIDE PROFILE
        // ------------------------------

        if (profile) {
            profile.style.display =
                "none";
        }


        // ------------------------------
        // HIDE LOGOUT
        // ------------------------------

        if (logout) {
            logout.style.display =
                "none";
        }

    }
}


// ==========================================
// PROTECT LOGIN / SIGNUP PAGES
// ==========================================

function redirectIfAlreadyLoggedIn() {

    const page =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const authPages = [
        "login.html",
        "signup.html",
        "register.html"
    ];

    if (
        isKavroLoggedIn() &&
        authPages.includes(page)
    ) {

        window.location.replace(
            "dashboard.html"
        );

    }

}


// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateKavroNavigation();

        redirectIfAlreadyLoggedIn();

    }
);