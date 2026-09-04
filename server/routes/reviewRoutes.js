const express = require("express");
const jwt = require("jsonwebtoken");
const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");

const router = express.Router();

function getUserId(req) {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) return null;
    try {
        const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        return decoded.id;
    } catch (_) {
        return null;
    }
}

router.get("/", async (req, res) => {
    try {
        const reviews = await Review.find({ verifiedPurchase: true })
            .sort({ createdAt: -1 })
            .limit(12)
            .select("product rating comment customerName createdAt verifiedPurchase");
        const summary = await Review.aggregate([
            { $match: { verifiedPurchase: true } },
            { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);
        return res.json({ success: true, reviews, summary: summary[0] || { average: 0, count: 0 } });
    } catch (error) {
        console.error("GET REVIEWS ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not load reviews." });
    }
});

router.post("/", async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, message: "Please sign in to leave a review." });

        const orderId = String(req.body.orderId || "").trim();
        const rating = Number(req.body.rating);
        const comment = String(req.body.comment || "").trim();
        if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 3 || comment.length > 500) {
            return res.status(400).json({ success: false, message: "Choose a rating and enter a short review." });
        }

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) return res.status(404).json({ success: false, message: "Order not found." });
        if (!["completed", "delivered"].includes(String(order.status || "").toLowerCase())) {
            return res.status(400).json({ success: false, message: "You can review an order after it is completed." });
        }
        if (await Review.exists({ orderId })) return res.status(409).json({ success: false, message: "You have already reviewed this order." });

        const user = await User.findById(userId).select("name");
        const review = await Review.create({ userId, orderId, product: order.product, rating, comment, customerName: user?.name || "Customer" });
        return res.status(201).json({ success: true, review });
    } catch (error) {
        console.error("CREATE REVIEW ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not submit your review." });
    }
});

module.exports = router;
