const API_URL =
    "https://kavro-api.onrender.com/api/auth";


const form =
    document.getElementById("loginForm");


// ==========================================
// SAVE LOGIN SESSION
// ==========================================

function saveKavroSession(data) {

    localStorage.setItem(
        "kavroToken",
        data.token
    );

    localStorage.setItem(
        "kavroUser",
        JSON.stringify(data.user)
    );
}


// ==========================================
// NORMAL LOGIN
// ==========================================

if (form) {

    form.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("password")
                    .value;

            const button =
                form.querySelector(
                    "button[type='submit']"
                );

            if (!email || !password) {

                alert(
                    "Please enter your email and password."
                );

                return;

            }

            button.disabled = true;
            button.textContent =
                "Logging in...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/login`,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email,
                                    password
                                })

                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.message ||
                        "Login failed."
                    );

                }

                saveKavroSession(data);

                button.textContent =
                    "Login Successful ✓";

                const checkoutReturn = sessionStorage.getItem("kavroCheckoutReturn");
                sessionStorage.removeItem("kavroCheckoutReturn");
                window.location.replace(checkoutReturn || "index.html");

            }

            catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Login failed."
                );

                button.disabled = false;

                button.textContent =
                    "Login";

            }

        }
    );

}


/* Google sign-in is handled by google-auth.js on both auth pages. */
/* ==========================================
// GOOGLE LOGIN
// ==========================================

async function handleGoogleLogin(
    response
) {

    try {

        if (
            !response ||
            !response.credential
        ) {

            throw new Error(
                "Google login did not return a credential."
            );

        }

        const googleResponse =
            await fetch(
                `${API_URL}/google`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            credential:
                                response.credential
                        })

                }
            );

        const data =
            await googleResponse.json();

        if (
            !googleResponse.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Google login failed."
            );

        }

        saveKavroSession(data);

        const checkoutReturn = sessionStorage.getItem("kavroCheckoutReturn");
        sessionStorage.removeItem("kavroCheckoutReturn");
        window.location.replace(checkoutReturn || "index.html");

    }

    catch (error) {

        console.error(
            "GOOGLE LOGIN ERROR:",
            error
        );

        alert(
            error.message ||
            "Google login failed."
        );

    }

}


// ==========================================
// GOOGLE BUTTON
// ==========================================

function initializeGoogleLogin() {

    if (
        !window.google ||
        !google.accounts ||
        !google.accounts.id
    ) {

        setTimeout(
            initializeGoogleLogin,
            300
        );

        return;

    }

    const container =
        document.getElementById(
            "googleLoginButton"
        );

    if (!container) {
        return;
    }

    google.accounts.id.initialize({

        client_id:
            GOOGLE_CLIENT_ID,

        callback:
            handleGoogleLogin,

        auto_select:
            false

    });

    google.accounts.id.renderButton(
        container,
        {

            type: "standard",

            theme: "outline",

            size: "large",

            text: "continue_with",

            shape: "rectangular",

            width: 320

        }
    );

}


// ==========================================
// START GOOGLE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    initializeGoogleLogin
);
*/
