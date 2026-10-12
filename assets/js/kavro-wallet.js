(function () {
    const API = "https://kavro-api.onrender.com";
    function init() {
        if (document.getElementById("kavroWalletPill")) return;
        const nav = document.querySelector(".navbar");
        if (!nav) return;
        const token = localStorage.getItem("kavroToken");
        const pill = document.createElement("a");
        pill.id = "kavroWalletPill";
        pill.href = token ? "order.html?type=coins" : "login.html";
        pill.title = token ? "Buy Kavro Coins" : "Sign in to buy Kavro Coins";
        pill.setAttribute("aria-label", "Kavro Coins balance and top-up");
        pill.textContent = "🪙 Coins: 0 +";
        pill.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:4px;margin-left:8px;padding:8px 13px;border:1px solid #60a5fa;border-radius:999px;background:#10294d;color:#dbeafe;text-decoration:none;font-weight:800;white-space:nowrap;box-shadow:0 4px 14px rgba(37,99,235,.18)";
        const help = nav.querySelector(".btn-primary");
        if (help) help.parentNode.insertBefore(pill, help); else nav.appendChild(pill);
        if (!token) return;
        fetch(`${API}/api/credits/balance`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => {
                if (data.success) pill.textContent = `🪙 Coins: ${Number(data.balance || 0).toLocaleString()} +`;
            }).catch(() => {});
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
