const adminToken = localStorage.getItem("adminToken");
if (!adminToken) window.location.href = "admin-login.html";

const tbody = document.getElementById("creditRequests");

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadCreditRequests() {
    try {
        const response = await fetch("https://kavro-api.onrender.com/api/credits/admin/topups", {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Could not load requests.");
        if (!data.topups.length) {
            tbody.innerHTML = `<tr><td colspan="7">No credit requests.</td></tr>`;
            return;
        }
        tbody.innerHTML = data.topups.map(item => {
            const user = item.userId || {};
            const actions = item.status === "Pending"
                ? `<button onclick="reviewCredit('${item._id}','Approved')">Approve</button>
                   <button style="background:#dc2626" onclick="reviewCredit('${item._id}','Rejected')">Reject</button>`
                : "—";
            return `<tr>
                <td>${escapeHtml(user.name || user.email || "User")}</td>
                <td>NPR ${escapeHtml(item.amount)}</td>
                <td>${escapeHtml(item.paymentMethod)}</td>
                <td>${escapeHtml(item.remarks || "—")}</td>
                <td><a href="${escapeHtml(item.screenshot)}" target="_blank">View proof</a></td>
                <td>${escapeHtml(item.status)}</td>
                <td>${actions}</td>
            </tr>`;
        }).join("");
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(error.message)}</td></tr>`;
    }
}

async function reviewCredit(id, status) {
    if (!confirm(`${status} this credit request?`)) return;
    const response = await fetch(`https://kavro-api.onrender.com/api/credits/admin/topups/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
    });
    const data = await response.json();
    alert(data.message || "Updated.");
    loadCreditRequests();
}

document.getElementById("refreshCredits").onclick = loadCreditRequests;
loadCreditRequests();
