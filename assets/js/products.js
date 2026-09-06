const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-btn");
let loadedProducts = [];
let activeCategory = "all";

if (grid) {
    grid.innerHTML = `
        <div class="kavro-loader" aria-label="Loading products">
            <span></span>
            <small>Loading products…</small>
        </div>
    `;
}

function normalize(value) {
    return String(value || "").toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

function productLink(product) {
    if (product.slug === "freefire-bots") return "freefire-bots.html";
    if (product.category === "Subscriptions") return `subscription.html?slug=${product.slug}`;
    if (product.slug === "ff") return "freefire.html";
    if (product.slug === "pubg") return "pubg.html";
    if (product.slug === "roblox") return "roblox.html";
    if (product.slug === "unipin") return "unipin.html";
    if (product.slug === "mlbb") return "mobile-legends.html";
    if (product.slug === "steam") return "steam.html";
    return "#";
}

function renderProducts() {
    const search = normalize(searchInput?.value);
    const filtered = loadedProducts.filter(product => {
        const category = normalize(product.category);
        const searchable = normalize(`${product.name} ${product.description} ${product.slug} ${product.category}`);
        const categoryMatches = activeCategory === "all" || category.includes(activeCategory) || searchable.includes(activeCategory);
        return product.active && categoryMatches && (!search || searchable.includes(search));
    });

    if (!filtered.length) {
        grid.innerHTML = `<div class="store-empty"><span>⌕</span><strong>No products found</strong><p>Try another search or category.</p></div>`;
        return;
    }

    grid.innerHTML = filtered.map(product => {
        const link = productLink(product);
        return `
        <a class="product-card" href="${link}" data-category="${normalize(product.category)}">
            <div class="product-card-media">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <span class="product-live-badge">Available</span>
            </div>
            <div class="product-card-copy">
                <h3>${product.name}</h3>
                <p>${product.description || "Fast and secure delivery"}</p>
                <span class="product-card-action">View packages <b>›</b></span>
            </div>
        </a>`;
    }).join("");
}

async function loadProducts() {

    const res = await fetch("https://kavro-api.onrender.com/api/products");

    loadedProducts = await res.json();
    renderProducts();

}

searchInput?.addEventListener("input", renderProducts);
categoryButtons.forEach(button => button.addEventListener("click", () => {
    categoryButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = normalize(button.dataset.category) || "all";
    renderProducts();
}));

loadProducts().catch(() => {
    grid.innerHTML = `<div class="store-empty"><span>!</span><strong>Products unavailable</strong><p>Please refresh and try again.</p></div>`;
});
