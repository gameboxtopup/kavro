let editingItemId = null;

const modal = document.getElementById("productModal");
const addBtn = document.getElementById("addProduct");
const closeBtn = document.querySelector(".close");
const form = document.getElementById("productForm");
const tbody = document.getElementById("products");

// Open Modal
addBtn.onclick = () => {
    document.getElementById("modalTitle").textContent = "Add Product Item";
    document.getElementById("saveBtn").textContent = "Save Item";
    editingItemId = null;
    form.reset();
    document.getElementById("active").checked = true;
    document.getElementById("stock").value = 0;
    loadProductDropdown();
    modal.style.display = "flex";
};

// Close Modal
closeBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// Load Product Dropdown
async function loadProductDropdown() {

    const res = await fetch("https://kavro-api.onrender.com/api/products");
    const products = await res.json();

    const select = document.getElementById("product");

    select.innerHTML = `<option value="">Select Product</option>`;

    products.forEach(product => {

        select.innerHTML += `
            <option value="${product._id}">
                ${product.name}
            </option>
        `;

    });

}

// Load Items
async function loadProducts() {

    const res = await fetch("https://kavro-api.onrender.com/api/product-items");

    const items = await res.json();

    tbody.innerHTML = "";

    items.forEach(item => {

        tbody.innerHTML += `
        <tr>

            <td>
                <img src="${item.image || "https://via.placeholder.com/50"}" width="50">
            </td>

            <td>${item.product ? item.product.name : "-"}</td>

            <td>${item.title}</td>

            <td>Rs. ${item.price}</td>

            <td>${item.stock ?? 0}</td>

            <td>${item.active ? "🟢 Active" : "🔴 Hidden"}</td>

            <td>

                <button onclick="editItem('${item._id}')">
                    Edit
                </button>

                <button onclick="deleteItem('${item._id}')">
                    Delete
                </button>

            </td>

        </tr>
        `;

    });

}

loadProducts();

// Save Item
form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const item = {

        product: document.getElementById("product").value,

        title: document.getElementById("name").value,

        price: Number(document.getElementById("price").value),

        discountPrice: Number(document.getElementById("discountPrice").value) || 0,

        description: document.getElementById("description").value,

        stock: Number(document.getElementById("stock").value),

        image: document.getElementById("image").value,

        active: document.getElementById("active").checked

    };

    let url = "https://kavro-api.onrender.com/api/product-items";

    let method = "POST";

    if (editingItemId) {

        url += "/" + editingItemId;

        method = "PUT";

    }

    const res = await fetch(url, {

        method,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(item)

    });

    const data = await res.json();

    alert(data.message);

    modal.style.display = "none";

    loadProducts();

});

// Delete
async function deleteItem(id) {

    if (!confirm("Delete this item?")) return;

    await fetch(`https://kavro-api.onrender.com/api/product-items/${id}`, {

        method: "DELETE"

    });

    loadProducts();

}

// Edit
async function editItem(id) {

    const res = await fetch(`https://kavro-api.onrender.com/api/product-items/${id}`);
    const item = await res.json();

    editingItemId = item._id;

    await loadProductDropdown();

    document.getElementById("product").value = item.product._id;
    document.getElementById("name").value = item.title;
    document.getElementById("price").value = item.price;
    document.getElementById("discountPrice").value =
    item.discountPrice || "";

    document.getElementById("description").value =
    item.description || "";

    document.getElementById("stock").value =
    item.stock ?? 0;
    document.getElementById("discountPrice").value = item.discountPrice || "";
    document.getElementById("image").value = item.image || "";
    document.getElementById("description").value = item.description || "";
    document.getElementById("stock").value = item.stock ?? 0;
    document.getElementById("active").checked = item.active;
    document.getElementById("modalTitle").textContent = "Edit Product Item";
    document.getElementById("saveBtn").textContent = "Update Item";
    modal.style.display = "flex";

}
