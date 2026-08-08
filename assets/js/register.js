const API_URL = "https://kavro-api.onrender.com/api/auth";

const form = document.getElementById("registerForm");

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
            form.querySelector("button[type='submit']");

        if (!name || !email || !password) {

            alert("Please fill all fields.");
            return;

        }

        button.disabled = true;
        button.textContent = "Creating account...";

        try {

            const response = await fetch(
                `${API_URL}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Could not create account."
                );

            }

            localStorage.setItem(
                "kavroToken",
                data.token
            );

            localStorage.setItem(
                "kavroUser",
                JSON.stringify(data.user)
            );

            button.textContent = "Account Created ✓";

            window.location.href =
                "dashboard.html";

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Registration failed."
            );

            button.disabled = false;
            button.textContent = "Create Account";

        }

    });

}