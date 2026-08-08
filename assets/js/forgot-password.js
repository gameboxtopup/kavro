const API_URL = "https://kavro-api.onrender.com/api/auth";

const form =
    document.getElementById("forgotPasswordForm");

if (form) {

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const button =
            form.querySelector("button[type='submit']");

        if (!email) {

            alert("Please enter your email.");
            return;

        }

        button.disabled = true;
        button.textContent = "Sending...";

        try {

            const response = await fetch(
                `${API_URL}/forgot-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Could not send reset email."
                );

            }

            form.innerHTML = `

                <div class="success-message">

                    <h3>Check your email 📧</h3>

                    <p>
                        If an account exists with that
                        email, we've sent you a password
                        reset link.
                    </p>

                    <p>
                        Check your <strong>Primary</strong>
                        inbox.
                    </p>

                    <p>
                        If you don't see it, check Spam
                        or Promotions too.
                    </p>

                </div>

            `;

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Could not send reset email."
            );

            button.disabled = false;
            button.textContent = "Send Reset Link";

        }

    });

}