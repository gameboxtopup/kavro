const API_URL = "https://kavro-api.onrender.com/api/auth";

const form =
    document.getElementById("resetPasswordForm");

if (form) {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const token =
        params.get("token");

    if (!token) {

        alert("Invalid password reset link.");

    }

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;

        const button =
            form.querySelector("button[type='submit']");

        if (!password || !confirmPassword) {

            alert("Please enter your new password.");
            return;

        }

        if (password.length < 6) {

            alert(
                "Password must be at least 6 characters."
            );

            return;

        }

        if (password !== confirmPassword) {

            alert("Passwords do not match.");
            return;

        }

        button.disabled = true;
        button.textContent = "Resetting...";

        try {

            const response = await fetch(
                `${API_URL}/reset-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        token,

                        password

                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Password reset failed."
                );

            }

            form.innerHTML = `

                <div class="success-message">

                    <h3>Password Reset Successfully ✓</h3>

                    <p>
                        Your password has been changed.
                    </p>

                    <a href="login.html">
                        Login to your account
                    </a>

                </div>

            `;

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Password reset failed."
            );

            button.disabled = false;
            button.textContent = "Reset Password";

        }

    });

}