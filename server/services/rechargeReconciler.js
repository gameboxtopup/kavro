const Order = require("../models/Order");
const { getRechargeOrder } = require("./rechargeGames");
const { applyRechargeResult } = require("./rechargeOrderSync");

async function reconcileRechargeOrders() {
    if (!process.env.RECHARGE_API_KEY) return;
    const orders = await Order.find({
        product: { $in: ["Free Fire", "PUBG Mobile"] },
        providerOrderId: { $nin: ["", null] },
        providerStatus: { $nin: ["delivered", "failed"] }
    }).limit(25);
    for (const order of orders) {
        try { await applyRechargeResult(order, await getRechargeOrder(order.providerOrderId)); }
        catch (error) { console.error(`RechargeGames reconciliation failed for ${order._id}:`, error.message); }
    }
}

function startRechargeReconciler() {
    const run = () => reconcileRechargeOrders().catch(error => console.error("RechargeGames reconciliation error:", error));
    setTimeout(run, 15000);
    return setInterval(run, 60000);
}

module.exports = { startRechargeReconciler, reconcileRechargeOrders };
