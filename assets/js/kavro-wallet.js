(function () {
    "use strict";

    const API = "https://kavro-api.onrender.com";

    function initWalletButton() {
        if (document.getElementById("kavroWalletPill")) return;

        const navbar = document.querySelector(".navbar");
        const dashboardHeader = document.querySelector(
            ".dashboard-header .header-right"
        );

        const host = navbar || dashboardHeader;
        if (!host) return;

        const token = localStorage.getItem("kavroToken");

        const pill = document.createElement("a");
        pill.id = "kavroWalletPill";
        pill.href = token ? "coin-order.html" : "login.html";
        pill.title = token
            ? "Buy Kavro Coins"
            : "Sign in to buy Kavro Coins";
        pill.setAttribute(
            "aria-label",
            "Kavro Coins balance and top-up"
        );
        pill.textContent = "🪙 Coins: 0 +";

        pill.style.cssText = `
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:4px;
            padding:8px 13px;
            border:1px solid #60a5fa;
            border-radius:999px;
            background:#10294d;
            color:#dbeafe;
            text-decoration:none;
            font-weight:800;
            white-space:nowrap;
            box-shadow:0 4px 14px rgba(37,99,235,.18);
        `;

        if (navbar) {
            pill.style.marginLeft = "8px";

            const helpButton = navbar.querySelector(".btn-primary");

            if (helpButton) {
                helpButton.parentNode.insertBefore(pill, helpButton);
            } else {
                navbar.appendChild(pill);
            }
        } else {
            pill.style.marginRight = "10px";
            pill.style.fontSize = "13px";

            const logoutButton = dashboardHeader.querySelector(
                "#logoutBtn, .logout-btn"
            );

            if (logoutButton) {
                logoutButton.parentNode.insertBefore(
                    pill,
                    logoutButton
                );
            } else {
                dashboardHeader.appendChild(pill);
            }
        }

        if (!token) return;

        fetch(`${API}/api/credits/balance`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    pill.textContent =
                        `🪙 Coins: ${Number(data.balance || 0).toLocaleString()} +`;
                }
            })
            .catch(() => {});
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initWalletButton,
            { once: true }
        );
    } else {
        initWalletButton();
    }
})();