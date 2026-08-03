/* ==========================================
   KAVRO ADMIN PANEL
========================================== */

// ----------------------
// Check Login
// ----------------------

const token = localStorage.getItem("adminToken");
const socket = io("https://kavro-api.onrender.com");

socket.on("connect", () => {
    console.log("🟢 Dashboard Connected");
});

socket.on("newOrder", () => {
    loadOrders();
});

socket.on("orderUpdated", () => {
    loadOrders();
});

if (!token) {
    window.location.href = "admin-login.html";
}

// ----------------------
// Logout
// ----------------------

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        if (confirm("Are you sure you want to logout?")) {

            localStorage.removeItem("adminToken");

            window.location.href = "admin-login.html";

        }

    });

}

// ----------------------
// Load Orders
// ----------------------

let allOrders = [];

async function loadOrders() {

    try {

        const response = await fetch("https://kavro-api.onrender.com/api/orders", {

    headers: {
        Authorization: "Bearer " + token
    }

});

        const data = await response.json();

        allOrders = data;

        displayOrders(allOrders);

        updateCards(allOrders);

    }

    catch (err) {

        console.error(err);

        document.getElementById("ordersTable").innerHTML = `
        <tr>
            <td colspan="6">
                Failed to load orders.
            </td>
        </tr>
        `;

    }

}

// ----------------------
// Dashboard Cards
// ----------------------

function updateCards(orders) {

    document.getElementById("totalOrders").textContent = orders.length;

    let pending = 0;
    let delivered = 0;
    let revenue = 0;

    orders.forEach(order => {

        if (order.status === "Pending")
            pending++;

        if (order.status === "Delivered")
            delivered++;

        revenue += Number(order.price || 0);

    });

    document.getElementById("pendingOrders").textContent = pending;

    document.getElementById("deliveredOrders").textContent = delivered;

    document.getElementById("revenue").textContent =
        "NPR " + revenue.toLocaleString();

}

// ----------------------
// Show Orders
// ----------------------

function displayOrders(orders) {

    const table = document.getElementById("ordersTable");

    if (orders.length === 0) {

        table.innerHTML = `
        <tr>
            <td colspan="6">
                No Orders Found
            </td>
        </tr>
        `;

        return;

    }

    table.innerHTML = "";

    orders.forEach(order => {

        table.innerHTML += `

<tr>

<td>${order.product}</td>

<td>${order.uid}</td>

<td>${order.paymentMethod}</td>

<td>NPR ${order.price}</td>

<td>

<span class="status ${order.status.toLowerCase()}">

${order.status}

</span>

</td>

<td>

<button
class="action-btn">

View

</button>

</td>

</tr>

`;

    });

}

// ----------------------
// Search
// ----------------------

const search = document.getElementById("search");

if (search) {

    search.addEventListener("input", () => {

        const keyword = search.value.toLowerCase();

        const filtered = allOrders.filter(order =>

            order.product.toLowerCase().includes(keyword) ||

            order.uid.toLowerCase().includes(keyword) ||

            order.paymentMethod.toLowerCase().includes(keyword)

        );

        displayOrders(filtered);

    });

}

// ----------------------
// Start
// ----------------------

loadOrders();