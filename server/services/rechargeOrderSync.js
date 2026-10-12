const Order = require("../models/Order");
const User = require("../models/User");
const { providerStatus, isDelivered, isFailed } = require("./rechargeGames");

async function applyRechargeResult(order, data) {
    if (!order || !data) return order;
    const status = providerStatus(data);
    order.providerStatus = status;
    if (data.order_id && !order.providerOrderId) order.providerOrderId = String(data.order_id);
    if (isDelivered(data)) {
        order.status = "Completed";
        order.completedAt = order.completedAt || new Date();
    } else if (isFailed(data)) {
        if (order.creditsDebited > 0 && order.userId && !order.creditsRefunded) {
            const locked = await Order.findOneAndUpdate(
                { _id: order._id, creditsRefunded: false },
                { $set: { creditsRefunded: true, providerStatus: status } },
                { new: true }
            );
            if (locked) await User.findByIdAndUpdate(order.userId, { $inc: { kavroCredits: Number(order.creditsDebited) } });
        }
        order.status = order.creditsDebited > 0 ? "Refunded" : "Refund Required";
    } else if (order.status !== "Completed" && order.status !== "Refunded") {
        order.status = "Processing";
        order.processingStartedAt = order.processingStartedAt || new Date();
    }
    await order.save();
    return order;
}

module.exports = { applyRechargeResult };
