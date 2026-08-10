const API_URL = "https://kavro-api.onrender.com/api/auth";

const form = document.getElementById("loginForm");

if (form) {

    form.addEventListener("submit", async function (e) {

        e.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const button =
            form.querySelector("button[type='submit']");

        if (!email || !password) {

            alert("Please enter your email and password.");
            return;

        }

        button.disabled = true;
        button.textContent = "Logging in...";

        try {

            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Login failed."
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

            button.textContent = "Login Successful ✓";

            window.location.href = "index.html";

        }

        catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Login failed."
            );

            button.disabled = false;
            button.textContent = "Login";

        }

    });

}