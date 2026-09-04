(function () {
    const API_URL = "https://kavro-api.onrender.com/api/auth";
    const clientId = window.KAVRO_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
    const button = document.querySelector(".google-button");

    if (!button) return;

    function saveSession(data) {
        localStorage.setItem("kavroToken", data.token);
        localStorage.setItem("kavroUser", JSON.stringify(data.user));
    }

    function finishLogin(data) {
        saveSession(data);
        const returnTo = sessionStorage.getItem("kavroCheckoutReturn");
        sessionStorage.removeItem("kavroCheckoutReturn");
        window.location.replace(returnTo || "index.html");
    }

    async function handleCredential(response) {
        button.disabled = true;
        button.textContent = "Connecting to Google...";
        try {
            const result = await fetch(`${API_URL}/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await result.json();
            if (!result.ok || !data.success) throw new Error(data.message || "Google sign-in failed.");
            finishLogin(data);
        } catch (error) {
            console.error("GOOGLE LOGIN ERROR:", error);
            alert(error.message || "Google sign-in failed. Please try again.");
            button.disabled = false;
            button.textContent = "Continue with Google";
        }
    }

    function init() {
        if (!window.google?.accounts?.id) {
            setTimeout(init, 250);
            return;
        }
        if (clientId.startsWith("YOUR_")) {
            button.addEventListener("click", () => alert("Google sign-in is not configured yet. Add the Google client ID to this site."), { once: true });
            return;
        }
        google.accounts.id.initialize({ client_id: clientId, callback: handleCredential, auto_select: false });
        const host = document.createElement("div");
        host.id = "googleLoginButton";
        button.replaceWith(host);
        google.accounts.id.renderButton(host, { theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: 320 });
    }

    init();
})();
