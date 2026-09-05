const homeProductGrid = document.getElementById("homeProductGrid");

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getHomeProductLink(product) {
    if (product.category === "Subscriptions") return `subscription.html?slug=${encodeURIComponent(product.slug)}`;

    const links = {
        ff: "freefire.html",
        pubg: "pubg.html",
        roblox: "roblox.html",
        unipin: "unipin.html",
        mlbb: "mobile-legends.html",
        steam: "steam.html"
    };

    return links[product.slug] || "products.html";
}

function getSafeImage(source) {
    const image = String(source || "").trim();
    if (/^https?:\/\//i.test(image) || /^assets\/images\//i.test(image)) return image;
    return "assets/images/logo.png";
}

async function loadHomeProducts() {
    const response = await fetch("https://kavro-api.onrender.com/api/products");
    if (!response.ok) throw new Error("Unable to load products");

    const products = await response.json();
    const activeProducts = products.filter(product => product.active);

    if (!activeProducts.length) {
        homeProductGrid.innerHTML = `<div class="home-products-loading">No products are available right now.</div>`;
        return;
    }

    homeProductGrid.innerHTML = activeProducts.map(product => `
        <a class="home-card home-store-card" href="${getHomeProductLink(product)}">
            <div class="card-image">
                <img src="${escapeHtml(getSafeImage(product.image))}" alt="${escapeHtml(product.name)}" loading="lazy">
                <span class="home-available-badge">Available</span>
            </div>
            <div class="card-content">
                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.description || "Fast and secure delivery from Kavro.")}</p>
                <span class="home-card-link">View packages <b>›</b></span>
            </div>
        </a>
    `).join("");
}

loadHomeProducts().catch(() => {
    homeProductGrid.innerHTML = `<div class="home-products-loading">Products could not load. Please refresh.</div>`;
});
