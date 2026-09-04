const API_URL = "https://kavro-api.onrender.com/api/auth";

const form = document.getElementById("registerForm");

const googleButton =
    document.querySelector(".google-button");


if (form) {

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const button =
            form.querySelector(
                "button[type='submit']"
            );


        if (!name || !email || !password) {

            alert("Please fill all fields.");

            return;

        }


        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;

        }


        button.disabled = true;

        button.textContent =
            "Creating account...";


        try {

            const response =
                await fetch(
                    `${API_URL}/register`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                name,
                                email,
                                password

                            })

                    }
                );


            // IMPORTANT:
            // Read text first so HTML responses
            // don't cause JSON parsing errors.

            const responseText =
                await response.text();


            console.log(
                "Register server response:",
                response.status,
                responseText
            );


            let data = null;


            try {

                data =
                    JSON.parse(responseText);

            }

            catch (jsonError) {

                console.error(
                    "Server returned non-JSON:",
                    responseText
                );


                throw new Error(
                    "Server returned an invalid response. Please try again."
                );

            }


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Could not create account."
                );

            }


            // IMPORTANT:
            // Use the same token name as dashboard.js

            localStorage.setItem(
                "kavroToken",
                data.token
            );


            localStorage.setItem(
                "kavroUser",
                JSON.stringify(
                    data.user
                )
            );


            button.textContent =
                "Account Created ✓";


            const checkoutReturn = sessionStorage.getItem("kavroCheckoutReturn");
            sessionStorage.removeItem("kavroCheckoutReturn");
            window.location.href = checkoutReturn || "index.html";

        }

        catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );


            alert(
                error.message ||
                "Registration failed."
            );


            button.disabled = false;

            button.textContent =
                "Create Account";

        }

    });

}


// =========================================
// GOOGLE LOGIN
// =========================================
//
// Google authentication is NOT implemented
// on your backend yet, so don't call a fake
// /api/auth/google endpoint.
//
// For now show a clear message instead of
// having a button that appears broken.
//

if (googleButton) {

    googleButton.addEventListener(
        "click",
        function () {

            alert(
                "Google login is not connected yet."
            );

        }
    );

}
