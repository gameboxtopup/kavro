const API_URL = "https://kavro-api.onrender.com";
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    window.location.href = "admin-login.html";
}

const conversationList = document.getElementById("conversationList");
const messagesBox = document.getElementById("adminChatMessages");
const customerHeader = document.getElementById("selectedCustomer");
const replyForm = document.getElementById("adminReplyForm");
const replyInput = document.getElementById("adminReplyInput");
const replyButton = replyForm.querySelector("button");

let conversations = [];
let selectedUserId = null;

document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "admin-login.html";
};

document.getElementById("refreshChat").onclick = loadConversations;

async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/api/chat/admin/all`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("adminToken");
                window.location.href = "admin-login.html";
                return;
            }
            throw new Error(data.message || "Could not load conversations.");
        }

        conversations = groupMessages(data.messages || []);
        renderConversationList();

        if (selectedUserId) {
            renderSelectedConversation();
        }
    } catch (error) {
        conversationList.innerHTML =
            `<p class="chat-placeholder">${escapeHtml(error.message)}</p>`;
    }
}

function groupMessages(messages) {
    const grouped = new Map();

    messages.forEach(message => {
        const user = message.userId || {};
        const userId = String(user._id || user);

        if (!grouped.has(userId)) {
            grouped.set(userId, {
                userId,
                name: user.name || "Customer",
                email: user.email || "",
                messages: []
            });
        }

        grouped.get(userId).messages.push(message);
    });

    return Array.from(grouped.values()).sort((a, b) => {
        const aTime = new Date(a.messages.at(-1)?.createdAt || 0);
        const bTime = new Date(b.messages.at(-1)?.createdAt || 0);
        return bTime - aTime;
    });
}

function renderConversationList() {
    if (!conversations.length) {
        conversationList.innerHTML =
            '<p class="chat-placeholder">No customer messages yet.</p>';
        return;
    }

    conversationList.innerHTML = conversations.map(chat => {
        const last = chat.messages.at(-1);
        return `
            <button class="conversation-item ${chat.userId === selectedUserId ? "active" : ""}"
                data-user-id="${escapeHtml(chat.userId)}">
                <strong>${escapeHtml(chat.name)}</strong>
                <small>${escapeHtml(chat.email || "Customer account")}</small>
                <span>${escapeHtml(last?.message || "")}</span>
            </button>`;
    }).join("");

    conversationList.querySelectorAll("[data-user-id]").forEach(button => {
        button.onclick = () => {
            selectedUserId = button.dataset.userId;
            renderConversationList();
            renderSelectedConversation();
        };
    });
}

function renderSelectedConversation() {
    const chat = conversations.find(item => item.userId === selectedUserId);
    if (!chat) return;

    customerHeader.innerHTML =
        `<strong>${escapeHtml(chat.name)}</strong><small>${escapeHtml(chat.email)}</small>`;

    messagesBox.innerHTML = chat.messages.map(message => `
        <div class="admin-chat-message ${message.sender === "admin" ? "sent" : "received"}">
            <div>${escapeHtml(message.message)}</div>
            <small>${formatDate(message.createdAt)}</small>
        </div>
    `).join("");

    messagesBox.scrollTop = messagesBox.scrollHeight;
    replyInput.disabled = false;
    replyButton.disabled = false;
    replyInput.focus();
}

replyForm.addEventListener("submit", async event => {
    event.preventDefault();
    const message = replyInput.value.trim();
    if (!selectedUserId || !message) return;

    replyInput.disabled = true;
    replyButton.disabled = true;

    try {
        const response = await fetch(`${API_URL}/api/chat/admin/reply`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`
            },
            body: JSON.stringify({ userId: selectedUserId, message })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Could not send reply.");
        }
        replyInput.value = "";
        await loadConversations();
    } catch (error) {
        alert(error.message);
    } finally {
        replyInput.disabled = false;
        replyButton.disabled = false;
        replyInput.focus();
    }
});

const socket = io(API_URL);
socket.on("chatMessage", () => loadConversations());

function formatDate(value) {
    return value ? new Date(value).toLocaleString() : "";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

loadConversations();
