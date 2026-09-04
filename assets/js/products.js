const grid = document.getElementById("productGrid");

async function loadProducts() {

    const res = await fetch("https://kavro-api.onrender.com/api/products");

    const products = await res.json();

    grid.innerHTML = "";

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

        } else if (product.slug === "mlbb") {

            link = "mobile-legends.html";

        }

        grid.innerHTML += `

        <div class="product-card">

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p>${product.description || ""}</p>

            <a href="${link}" class="btn-primary">

                View Products

            </a>

        </div>

        `;

    });

}

loadProducts();
