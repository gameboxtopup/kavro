const API_URL = "https://kavro-api.onrender.com";

// PRODUCT_SLUG is defined in freefire.html / pubg.html / roblox.html
// Example:
// const PRODUCT_SLUG = "ff";

async function loadProductItems() {
    try {

        if (typeof PRODUCT_SLUG === "undefined") {
            console.error("PRODUCT_SLUG is not defined.");
            return;
        }

        // ==========================================
        // 1. GET ALL PRODUCTS
        // ==========================================

        const productResponse = await fetch(
            `${API_URL}/api/products`
        );

        if (!productResponse.ok) {
            throw new Error("Failed to load products");
        }

        const products = await productResponse.json();

        // Find the current product using its slug
        const product = products.find(
            item => item.slug === PRODUCT_SLUG
        );

        if (!product) {
            console.error(
                `Product with slug "${PRODUCT_SLUG}" was not found.`
            );
            return;
        }

        // ==========================================
        // 2. GET PRODUCT ITEMS
        // ==========================================

        const itemsResponse = await fetch(
            `${API_URL}/api/product-items/product/${product._id}`
        );

        if (!itemsResponse.ok) {
            throw new Error("Failed to load product items");
        }

        const items = await itemsResponse.json();

        // ==========================================
        // 3. FIND PACKAGE CONTAINER
        // ==========================================

        const container = document.getElementById("diamond");

        if (!container) {
            console.error(
                'Element with id="diamond" was not found.'
            );
            return;
        }

        container.innerHTML = "";

        // ==========================================
        // 4. NO PACKAGES
        // ==========================================

        if (!items.length) {

            container.innerHTML = `
                <div class="no-packages">
                    <h3>No packages available</h3>
                    <p>Please check back later.</p>
                </div>
            `;

            return;
        }

        // ==========================================
        // 5. DISPLAY PRODUCT ITEMS
        // ==========================================

        items.forEach(item => {

            const card = document.createElement("div");

            card.className = "package-card";

            card.innerHTML = `
                
                ${
                    item.image
                        ? `
                            <img
                                src="${item.image}"
                                alt="${escapeHTML(item.title)}"
                                class="package-image"
                            >
                          `
                        : ""
                }

                <div class="package-info">

                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>

                    ${
                        item.description
                            ? `
                                <p>
                                    ${escapeHTML(item.description)}
                                </p>
                              `
                            : ""
                    }

                    <div class="package-price">

                        ${
                            item.discountPrice &&
                            item.discountPrice > 0 &&
                            item.discountPrice < item.price
                                ? `
                                    <span class="old-price">
                                        Rs. ${item.price}
                                    </span>

                                    <strong>
                                        Rs. ${item.discountPrice}
                                    </strong>
                                  `
                                : `
                                    <strong>
                                        Rs. ${item.price}
                                    </strong>
                                  `
                        }

                    </div>

                    <button
                        type="button"
                        class="package-select-btn"
                    >
                        Select
                    </button>

                </div>
            `;

            // ==========================================
            // 6. SELECT PACKAGE
            // ==========================================

            const button = card.querySelector(
                ".package-select-btn"
            );

            button.addEventListener("click", function () {

                selectPackage(item);

            });

            container.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        const container =
            document.getElementById("diamond");

        if (container) {

            container.innerHTML = `
                <div class="no-packages">
                    <h3>Unable to load packages</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;

        }

    }
}


// ==========================================
// SELECT PACKAGE
// ==========================================

function selectPackage(item) {

    const nameElement =
        document.getElementById("packageName");

    const priceElement =
        document.getElementById("packagePrice");

    const buyButton =
        document.getElementById("buyButton");

    if (nameElement) {

        nameElement.textContent =
            item.title;

    }

    if (priceElement) {

        const finalPrice =
            item.discountPrice &&
            item.discountPrice > 0 &&
            item.discountPrice < item.price
                ? item.discountPrice
                : item.price;

        priceElement.textContent =
            `Rs. ${finalPrice}`;

    }

    // Store selected item
    window.selectedProductItem = item;

    // Update Buy button
    if (buyButton) {

        const finalPrice =
            item.discountPrice &&
            item.discountPrice > 0 &&
            item.discountPrice < item.price
                ? item.discountPrice
                : item.price;

        buyButton.href =
            `contact.html?product=${encodeURIComponent(item.title)}&price=${finalPrice}`;

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    loadProductItems
);