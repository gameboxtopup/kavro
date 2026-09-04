const grid = document.getElementById("productGrid");

async function loadProducts() {

    const res = await fetch("https://kavro-api.onrender.com/api/products");

    const products = await res.json();

    grid.innerHTML = "";

    const hasUnipin = products.some(product => product.slug === "unipin");

    if (!hasUnipin) {
        grid.innerHTML += `
        <div class="product-card" data-product="unipin">
            <img src="assets/images/giftcards.webp" alt="UniPin 2000 UPBD Voucher">
            <h3>UniPin 2000 UPBD</h3>
            <p>Bangladesh-region digital voucher delivered to your Kavro account email.</p>
            <div class="price">Rs. 2,399</div>
            <a href="unipin.html" class="btn-primary">View Product</a>
        </div>
        `;
    }

    products.forEach(product => {

        if (!product.active) return;

        // Decide which page to open
        let link = "#";

        if (product.category === "Subscriptions") {

            link = `subscription.html?slug=${product.slug}`;

        } else if (product.slug === "ff") {

            link = "freefire.html";

        } else if (product.slug === "pubg") {

            link = "pubg.html";

        } else if (product.slug === "roblox") {

            link = "roblox.html";

        } else if (product.slug === "unipin") {

            link = "unipin.html";

        }

        grid.innerHTML += `

        <div class="product-card">

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p>${product.description || ""}</p>

            <div class="price">

                Starting from Rs. ${product.price}

            </div>

            <a href="${link}" class="btn-primary">

                View Products

            </a>

        </div>

        `;

    });

}

loadProducts();
