let editingProductId = null;

const modal = document.getElementById("productModal");
const addBtn = document.getElementById("addProduct");
const closeBtn = document.querySelector(".close");
const form = document.getElementById("productForm");
const tbody = document.getElementById("products");

// =========================
// OPEN ADD MODAL
// =========================

addBtn.onclick = () => {

    editingProductId = null;

    form.reset();

    document.getElementById("featured").checked = false;
    document.getElementById("active").checked = true;

    modal.style.display = "flex";

};

// =========================
// CLOSE MODAL
// =========================

closeBtn.onclick = () => {

    modal.style.display = "none";

};

window.onclick = (e) => {

    if (e.target === modal) {

        modal.style.display = "none";

    }

};

// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

    try {

        const res = await fetch("https://kavro-api.onrender.com/api/products");

        const products = await res.json();

        tbody.innerHTML = "";

        products.forEach(product => {

            tbody.innerHTML += `
            <tr>

                <td>
                    <img src="${product.image}" width="60">
                </td>

                <td>${product.name}</td>

                <td>${product.category}</td>

                <td>Rs. ${product.price}</td>

                <td>
                    ${product.active ? "🟢 Active" : "🔴 Hidden"}
                </td>

                <td>

                    <button class="action-btn edit"
                        onclick="editProduct('${product._id}')">
                        Edit
                    </button>

                    <button class="action-btn delete"
                        onclick="deleteProduct('${product._id}')">
                        Delete
                    </button>

                </td>

            </tr>
            `;

        });

    } catch (err) {

        console.error(err);

        alert("Failed to load products.");

    }

}

loadProducts();

// =========================
// SAVE PRODUCT
// =========================

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const product = {

        name: document.getElementById("name").value,
        slug: document.getElementById("slug").value,
        category: document.getElementById("category").value,
        price: Number(document.getElementById("price").value),
        discountPrice: Number(document.getElementById("discountPrice").value),
        image: document.getElementById("image").value,
        description: document.getElementById("description").value,
        stock: Number(document.getElementById("stock").value),
        featured: document.getElementById("featured").checked,
        active: document.getElementById("active").checked

    };

    let url = "https://kavro-api.onrender.com/api/products";
    let method = "POST";

    if (editingProductId) {

        url = `https://kavro-api.onrender.com/api/products/${editingProductId}`;
        method = "PUT";

    }

    try {

        const res = await fetch(url, {

            method,

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(product)

        });

        const data = await res.json();

        alert(data.message);

        modal.style.display = "none";

        form.reset();

        editingProductId = null;

        loadProducts();

    } catch (err) {

        console.error(err);

        alert("Request Failed.");

    }

});

// =========================
// DELETE PRODUCT
// =========================

async function deleteProduct(id) {

    if (!confirm("Delete this product?")) return;

    try {

        const res = await fetch(`https://kavro-api.onrender.com/api/products/${id}`, {

            method: "DELETE"

        });

        const data = await res.json();

        alert(data.message);

        loadProducts();

    } catch (err) {

        console.error(err);

    }

}

// =========================
// EDIT PRODUCT
// =========================

async function editProduct(id) {

    try {

        const res = await fetch(`https://kavro-api.onrender.com/api/products/${id}`);

        const product = await res.json();

        editingProductId = id;

        document.getElementById("name").value = product.name;
        document.getElementById("slug").value = product.slug;
        document.getElementById("category").value = product.category;
        document.getElementById("price").value = product.price;
        document.getElementById("discountPrice").value = product.discountPrice;
        document.getElementById("image").value = product.image;
        document.getElementById("description").value = product.description;
        document.getElementById("stock").value = product.stock;

        document.getElementById("featured").checked = product.featured;
        document.getElementById("active").checked = product.active;

        modal.style.display = "flex";

    } catch (err) {

        console.error(err);

        alert("Unable to load product.");

    }

}