(function () {
    const API = "https://kavro-api.onrender.com";
    function init() {
        if (document.getElementById("kavroWalletPill")) return;
        const nav = document.querySelector(".navbar");
        if (!nav) return;
        const token = localStorage.getItem("kavroToken");
        const pill = document.createElement("a");
        pill.id = "kavroWalletPill";
        pill.href = token ? "dashboard.html" : "login.html";
        pill.title = token ? "Open Kavro Wallet" : "Sign in to use Kavro Wallet";
        pill.textContent = "🪙 0+";
        pill.style.cssText = "display:inline-flex;align-items:center;margin-left:8px;padding:8px 12px;border:1px solid #60a5fa;border-radius:999px;background:#10294d;color:#dbeafe;text-decoration:none;font-weight:800;white-space:nowrap";
        const help = nav.querySelector(".btn-primary");
        if (help) help.parentNode.insertBefore(pill, help); else nav.appendChild(pill);
        if (!token) return;
        fetch(`${API}/api/credits/balance`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => { if (data.success) pill.textContent = `🪙 ${Number(data.balance || 0).toLocaleString()}+`; }).catch(() => {});
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
