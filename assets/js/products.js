const grid = document.getElementById("productGrid");

async function loadProducts() {

    const res = await fetch("https://kavro-api.onrender.com/api/products");

    const products = await res.json();

    grid.innerHTML = "";

    products.forEach(product => {

        if (!product.active) return;

        grid.innerHTML += `

        <div class="product-card">

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p>${product.description || ""}</p>

            <div class="price">

                Starting from Rs. ${product.price}

            </div>

            <a href="${product.slug}.html" class="btn-primary">

                View Products

            </a>

        </div>

        `;

    });

}

loadProducts();