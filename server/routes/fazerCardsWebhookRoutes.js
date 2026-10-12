const express = require("express");
const crypto = require("crypto");

const Order = require("../models/Order");
const User = require("../models/User");
const { isCompleted, isFailed } = require("../services/fazerCards");

const router = express.Router();

function signatureIsValid(rawBody, signature) {
    const secret = process.env.FAZER_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const expected = `sha256=${crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex")}`;

    const left = Buffer.from(expected);
    const right = Buffer.from(String(signature));
    return left.length === right.length && crypto.timingSafeEqual(left, right);
}

router.post("/", async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(JSON.stringify(req.body || {}));

    if (!signatureIsValid(rawBody, req.headers["x-webhook-signature"])) {
        return res.status(401).json({ success: false, message: "Invalid FazerCards webhook signature." });
    }

    try {
        const event = JSON.parse(rawBody.toString("utf8"));
        const providerOrder =
            event?.data?.order ||
            event?.order ||
            event?.data ||
            {};

        const providerOrderId = String(
            providerOrder.id ||
            providerOrder.order_id ||
            event?.data?.order_id ||
            ""
        );
        const providerStatus = String(
            providerOrder.status ||
            event?.data?.status ||
            ""
        ).toLowerCase();

        if (!providerOrderId) {
            return res.json({ ok: true, ignored: true });
        }

        const order = await Order.findOne({ providerOrderId });
        if (!order) {
            return res.json({ ok: true, ignored: true });
        }

        order.providerStatus = providerStatus || order.providerStatus;

        if (isCompleted(providerStatus)) {
            order.status = "Completed";
            order.completedAt = new Date();
        } else if (isFailed(providerStatus)) {
            order.status = "Refund Required";

            if (order.userId && order.creditsDebited > 0 && !order.creditsRefunded) {
                const marked = await Order.findOneAndUpdate(
                    { _id: order._id, creditsRefunded: false },
                    { $set: { creditsRefunded: true } },
                    { new: true }
                );

                if (marked) {
                    await User.findByIdAndUpdate(order.userId, {
                        $inc: { kavroCredits: order.creditsDebited }
                    });
                }
            }
        } else if (order.status === "Pending" || order.status === "Payment Verified") {
            order.status = "Processing";
            order.processingStartedAt = order.processingStartedAt || new Date();
        }

        await order.save();
        req.app.get("io")?.emit("orderUpdated", order);
        return res.json({ ok: true });
    } catch (error) {
        console.error("FAZERCARDS WEBHOOK ERROR:", error);
        return res.status(400).json({ success: false, message: "Invalid webhook payload." });
    }
});

module.exports = router;
