const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");
const { applyRechargeResult } = require("../services/rechargeOrderSync");

const router = express.Router();
function signingKey() {
    const secret = String(process.env.RECHARGE_WEBHOOK_SECRET || "").trim();
    if (!secret) return null;
    return Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
}
function validSignature(req, rawBody) {
    const key = signingKey();
    const id = String(req.headers["webhook-id"] || "");
    const timestamp = String(req.headers["webhook-timestamp"] || "");
    const header = String(req.headers["webhook-signature"] || "");
    if (!key || !id || !timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
    return header.split(" ").some(value => {
        const candidate = Buffer.from(value.replace(/^v1,/, ""));
        const expectedBuffer = Buffer.from(expected);
        return candidate.length === expectedBuffer.length && crypto.timingSafeEqual(candidate, expectedBuffer);
    });
}

router.post("/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
    if (!validSignature(req, rawBody)) return res.status(401).json({ success: false, message: "Invalid webhook signature." });
    try {
        const event = JSON.parse(rawBody);
        const data = event.data || {};
        const order = await Order.findOne({ providerOrderId: String(data.order_id || "") });
        if (order) {
            const updated = await applyRechargeResult(order, data);
            req.app.get("io")?.emit("orderUpdated", updated);
        }
        return res.sendStatus(204);
    } catch (error) {
        console.error("RECHARGE WEBHOOK ERROR:", error);
        return res.status(400).json({ success: false, message: "Invalid webhook payload." });
    }
});

module.exports = router;
