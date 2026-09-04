const API_URL = "https://kavro-api.onrender.com";
const token = localStorage.getItem("kavroToken");


// =========================================
// CHECK LOGIN
// =========================================

if (!token) {
    window.location.href = "login.html";
    throw new Error("Not logged in");
}


// =========================================
// ELEMENTS
// =========================================

const userName = document.getElementById("userName");
const welcomeName = document.getElementById("welcomeName");
const userEmail = document.getElementById("userEmail");

const logoutBtn = document.getElementById("logoutBtn");
const refreshOrders = document.getElementById("refreshOrders");

const ordersContainer =
    document.getElementById("ordersContainer");

const chatMessages =
    document.getElementById("chatMessages");

const chatForm =
    document.getElementById("chatForm");

const chatInput =
    document.getElementById("chatInput");


// =========================================
// LOAD USER
// =========================================

async function loadUser() {

    try {

        const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            throw new Error("Session expired.");

        }

        const user = data.user;

        userName.textContent =
            user.name || "Customer";

        welcomeName.textContent =
            user.name || "Customer";

        if (userEmail) {
            userEmail.textContent =
                user.email || "";
        }

        // Save user ID for chat
        localStorage.setItem(
            "userId",
            user._id || user.id
        );

        return true;
    }

    catch (error) {

        console.error("LOAD USER ERROR:", error);

        localStorage.removeItem("kavroToken");
        localStorage.removeItem("kavroUser");
        localStorage.removeItem("userId");

        window.location.href = "login.html";

        return false;
    }

}


// =========================================
// LOAD ORDERS
// =========================================

async function loadOrders() {

    ordersContainer.innerHTML = `
        <div class="loading">
            Loading your orders...
        </div>
    `;

    try {

        const response = await fetch(
            `${API_URL}/api/orders/my-orders`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load orders."
            );

        }

        const orders =
            data.orders || data || [];

        if (!orders.length) {

            ordersContainer.innerHTML = `
                <div class="chat-empty">
                    <div class="chat-icon">📦</div>
                    <p>No orders yet.</p>
                    <small>
                        Your orders will appear here.
                    </small>
                </div>
            `;

            return;

        }

        ordersContainer.innerHTML =
            orders.map(order => {

                const status =
                    order.status || "Pending";

                let statusClass =
                    "pending";

                if (
                    status.toLowerCase() ===
                    "delivered" ||
                    status.toLowerCase() ===
                    "completed"
                ) {
                    statusClass = "delivered";
                }

                else if (
                    status.toLowerCase() ===
                    "rejected"
                ) {
                    statusClass = "rejected";
                }

                else if (
                    status.toLowerCase() ===
                    "processing" ||
                    status.toLowerCase() ===
                    "payment verified"
                ) {
                    statusClass = "processing";
                }

                else if (
                    status.toLowerCase() ===
                    "refund required"
                ) {
                    statusClass = "refund-required";
                }

                return `
                    <div class="order-card">

                        <div class="order-top">

                            <strong>
                                ${escapeHtml(
                                    order.product
                                )}
                            </strong>

                            <span class="status ${statusClass}">
                                ${escapeHtml(status)}
                            </span>

                        </div>

                        <p>
                            Plan:
                            ${escapeHtml(
                                order.package
                            )}
                        </p>

                        <p>
                            Quantity:
                            ${escapeHtml(order.quantity || 1)}
                        </p>

                        <p>
                            Price:
                            ${escapeHtml(
                                order.price
                            )}
                        </p>

                        <p>
                            Transaction ID:
                            ${escapeHtml(
                                order.transactionId ||
                                "—"
                            )}
                        </p>

                        <small>
                            ${formatDate(
                                order.createdAt
                            )}
                        </small>

                    </div>
                `;

            }).join("");

    }

    catch (error) {

        console.error(
            "LOAD ORDERS ERROR:",
            error
        );

        ordersContainer.innerHTML = `
            <div class="chat-empty">
                <div class="chat-icon">⚠️</div>
                <p>Could not load your orders.</p>
                <small>
                    Please try refreshing.
                </small>
            </div>
        `;

    }

}


// =========================================
// LOAD CHAT
// =========================================

async function loadChat() {

    try {

        const response = await fetch(
            `${API_URL}/api/chat`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not load chat."
            );

        }

        const messages =
            data.messages || [];

        renderMessages(messages);

    }

    catch (error) {

        console.error(
            "LOAD CHAT ERROR:",
            error
        );

        chatMessages.innerHTML = `
            <div class="chat-empty">
                <div class="chat-icon">⚠️</div>
                <p>Could not load your messages.</p>
                <small>Please check your connection and open Chat again.</small>
            </div>
        `;

    }

}


// =========================================
// DISPLAY CHAT
// =========================================

function renderMessages(messages) {

    if (!messages.length) {

        chatMessages.innerHTML = `
            <div class="chat-empty">

                <div class="chat-icon">
                    💬
                </div>

                <p>
                    Need help with your order?
                </p>

                <small>
                    Send a message to Kavro support.
                </small>

            </div>
        `;

        return;

    }


    chatMessages.innerHTML =
        messages.map(message => {

            const mine =
                message.sender === "user";

            return `
                <div class="chat-message ${
                    mine ? "user-message" : "admin-message"
                }">

                    <div class="chat-bubble">

                        ${escapeHtml(
                            message.message
                        )}

                    </div>

                    <small>
                        ${formatDate(
                            message.createdAt
                        )}
                    </small>

                </div>
            `;

        }).join("");


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


// =========================================
// SEND CHAT MESSAGE
// =========================================

chatForm.addEventListener(
    "submit",
    async function (e) {

        e.preventDefault();

        const message =
            chatInput.value.trim();

        if (!message) {
            return;
        }


        chatInput.disabled = true;


        try {

            const response =
                await fetch(
                    `${API_URL}/api/chat`,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`

                        },

                        body:
                            JSON.stringify({
                                message
                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Message could not be sent."
                );

            }


            chatInput.value = "";

            await loadChat();

        }

        catch (error) {

            console.error(
                "SEND CHAT ERROR:",
                error
            );

            alert(
                error.message ||
                "Could not send message."
            );

        }

        finally {

            chatInput.disabled = false;

            chatInput.focus();

        }

    }
);


// =========================================
// SOCKET.IO
// =========================================

if (typeof io === "function") {

    const socket = io(API_URL, {
        transports: ["websocket", "polling"]
    });

    socket.on(
        "chatMessage",
        function (message) {

        const currentUserId =
            localStorage.getItem("userId");


        // Only show messages belonging
        // to this customer

        if (
            String(message.userId) !==
            String(currentUserId)
        ) {

            return;

        }


            loadChat();

        }
    );
}


// =========================================
// REFRESH ORDERS
// =========================================

if (refreshOrders) {

    refreshOrders.addEventListener(
        "click",
        loadOrders
    );

}


// =========================================
// LOGOUT
// =========================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        localStorage.removeItem("kavroToken");
        localStorage.removeItem("kavroUser");
        localStorage.removeItem("userId");

        window.location.href = "index.html";

    });

}


// =========================================
// HELPERS
// =========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatDate(date) {

    if (!date) {
        return "";
    }

    return new Date(date).toLocaleString();

}


// =========================================
// DASHBOARD TABS
// =========================================

const tabs = document.querySelectorAll(".dashboard-tab");

const ordersTab =
    document.getElementById("ordersTab");

const passwordTab =
    document.getElementById("passwordTab");

const chatTab =
    document.getElementById("chatTab");

const floatingChatBtn =
    document.getElementById("floatingChatBtn");

const validTabs = ["orders", "password", "chat"];

function activateDashboardTab(selected, updateHash = true) {

    if (!validTabs.includes(selected)) {
        selected = "orders";
    }

    tabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.tab === selected
        );
    });

    ordersTab.style.display =
        selected === "orders" ? "block" : "none";

    passwordTab.style.display =
        selected === "password" ? "block" : "none";

    chatTab.style.display =
        selected === "chat" ? "block" : "none";

    if (floatingChatBtn) {
        floatingChatBtn.style.display =
            selected === "chat" ? "none" : "flex";
    }

    if (updateHash) {
        history.replaceState(null, "", `#${selected}`);
    }

    if (selected === "chat") {
        loadChat();
        setTimeout(() => {
            chatInput.focus();
            chatTab.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 50);
    }
}

tabs.forEach(tab => {

    tab.addEventListener("click", () => {
        activateDashboardTab(tab.dataset.tab);
    });

});

if (floatingChatBtn) {
    floatingChatBtn.addEventListener("click", () => {
        activateDashboardTab("chat");
    });
}

window.addEventListener("hashchange", () => {
    activateDashboardTab(
        window.location.hash.slice(1),
        false
    );
});

activateDashboardTab(
    window.location.hash.slice(1) || "orders",
    false
);


// =========================================
// CHANGE CUSTOMER PASSWORD
// =========================================

const changePasswordForm =
    document.getElementById("changePasswordForm");

if (changePasswordForm) {

    changePasswordForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();

            const currentPassword =
                document.getElementById(
                    "currentPassword"
                ).value;

            const newPassword =
                document.getElementById(
                    "newPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            if (newPassword !== confirmPassword) {

                alert("New passwords do not match.");

                return;

            }


            if (newPassword.length < 6) {

                alert(
                    "New password must be at least 6 characters."
                );

                return;

            }


            try {

                const response = await fetch(
                    `${API_URL}/api/auth/change-password`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            currentPassword,
                            newPassword
                        })
                    }
                );


                const data =
                    await response.json();


                if (!response.ok || !data.success) {

                    throw new Error(
                        data.message ||
                        "Could not change password."
                    );

                }


                alert(
                    "Password changed successfully."
                );


                changePasswordForm.reset();

            }


            catch (error) {

                console.error(
                    "CHANGE PASSWORD ERROR:",
                    error
                );


                alert(
                    error.message ||
                    "Could not change password."
                );

            }

        }
    );

}


// =========================================
// START
// =========================================

(async function () {

    const userLoaded = await loadUser();

    if (!userLoaded) {
        return;
    }

    await loadOrders();
    await loadChat();

})();
