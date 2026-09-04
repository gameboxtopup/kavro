/* ===========================
   ADMIN ORDERS
=========================== */

const token = localStorage.getItem("adminToken");

if (!token) {
    window.location.href = "admin-login.html";
}

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.onclick = () => {

    localStorage.removeItem("adminToken");

    window.location.href = "admin-login.html";

};

let allOrders = [];
const notificationSound = new Audio("assets/sounds/notification.mp3");
notificationSound.volume = 1;

if ("Notification" in window && Notification.permission !== "granted") {

    Notification.requestPermission();

}

const socket = io("https://kavro-api.onrender.com");

socket.on("connect", () => {

    console.log("🟢 Connected to Socket.IO");

});

socket.on("newOrder", (order) => {

    console.log("📦 New Order Received", order);

    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => {});

    if (Notification.permission === "granted") {

        new Notification("🛒 New Order Received!", {

            body:
                `${order.product}\n${order.package}\n${order.price}`,

            icon: "assets/images/logo.png"

        });

    }

    loadOrders();

});

async function loadOrders(){

    try{

        const res = await fetch("https://kavro-api.onrender.com/api/orders",{

            headers:{
                Authorization:"Bearer " + token
            }

        });

        const data = await res.json();

        allOrders = data;

        displayOrders(allOrders);

    }

    catch(err){

        console.log(err);

    }

}

function displayOrders(orders){

    const table = document.getElementById("ordersTable");

    if(!orders.length){

        table.innerHTML = `
        <tr>
            <td colspan="6">
                No Orders Found
            </td>
        </tr>`;

        return;

    }

    table.innerHTML = "";

    orders.forEach(order=>{

        table.innerHTML += `

<tr>

<td>${order.product}</td>

<td>${order.uid}</td>

<td>${order.paymentMethod}</td>

<td>${order.price}</td>

<td>

<span class="status ${order.status.toLowerCase()}">

${order.status}

</span>

</td>

<td>

<button class="action-btn"
onclick="viewOrder('${order._id}')">
View
</button>

${
order.status === "Pending"
? `
<button class="action-btn"
style="background:#16a34a"
onclick="deliverOrder('${order._id}')">
Deliver
</button>
`
: ""
}

<button class="action-btn"
style="background:#dc2626"
onclick="deleteOrder('${order._id}')">
Delete
</button>

</td>

</tr>

`;

    });

}

function viewOrder(id){

    const order = allOrders.find(o => o._id === id);

    if(!order) return;

    document.getElementById("mProduct").textContent = order.product;

    document.getElementById("mPackage").textContent = order.package;

    document.getElementById("mUid").textContent = order.uid;

    document.getElementById("mPlayer").textContent =
        order.playerName || "Not verified";

    document.getElementById("mRegion").textContent =
        order.playerRegion || "N/A";

    document.getElementById("mPayment").textContent = order.paymentMethod;

    document.getElementById("mTransaction").textContent = order.transactionId;

    document.getElementById("mPrice").textContent = order.price;

    document.getElementById("mStatus").textContent = order.status;

    document.getElementById("mScreenshot").src = order.screenshot;
    document.getElementById("mScreenshotLink").href = order.screenshot;

    const img = document.getElementById("mScreenshot");

    img.onclick = () => {
        window.open(order.screenshot, "_blank");
    };

    document.getElementById("mNote").textContent =
        order.note || "No note.";

    document.getElementById("deliverBtn").onclick = function () {
        deliverOrder(order._id);
    };

    document.getElementById("orderModal").style.display = "flex";

}

const search=document.getElementById("search");

search.addEventListener("input",()=>{

    const keyword=search.value.toLowerCase();

    displayOrders(

        allOrders.filter(o=>

            o.product.toLowerCase().includes(keyword) ||

            o.uid.toLowerCase().includes(keyword) ||

            o.paymentMethod.toLowerCase().includes(keyword)

        )

    );

});

loadOrders();

const modal = document.getElementById("orderModal");

window.onclick = (e) => {

    if(e.target === modal){

        modal.style.display = "none";

    }

};

async function deliverOrder(id) {

    if (!confirm("Mark this order as Delivered?")) {
        return;
    }

    try {

        const res = await fetch(
            "https://kavro-api.onrender.com/api/orders/" + id,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    status: "Delivered"
                })
            }
        );

        const data = await res.json();

        if (data.success) {

            alert("Order marked as Delivered.");

                closeModal();

                loadOrders();

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.error(err);

        alert("Something went wrong.");

    }

}

function closeModal() {
    document.getElementById("orderModal").style.display = "none";
}


async function deleteOrder(id) {

    if (!confirm("Delete this order?")) return;

    try {

        const res = await fetch(
            "https://kavro-api.onrender.com/api/orders/" + id,
            {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const data = await res.json();

        if (data.success) {

            alert("Order deleted.");

            closeModal();

            loadOrders();

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.log(err);

        alert("Delete failed.");

    }

}
