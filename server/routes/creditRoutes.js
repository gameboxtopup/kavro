const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const CreditTopup = require("../models/CreditTopup");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

async function requireUser(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : "";
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) throw new Error("User not found");
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Please sign in again." });
    }
}

router.get("/balance", requireUser, async (req, res) => {
    return res.json({ success: true, balance: Number(req.user.kavroCredits || 0) });
});

router.get("/topups", requireUser, async (req, res) => {
    const topups = await CreditTopup.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, topups, balance: Number(req.user.kavroCredits || 0) });
});

router.post("/topups", requireUser, async (req, res) => {
    const amount = Number(req.body.amount);
    const paymentMethod = String(req.body.paymentMethod || "").trim();
    const screenshot = String(req.body.screenshot || "").trim();
    const remarks = String(req.body.remarks || "").trim();

    if (!Number.isFinite(amount) || amount < 10 || amount > 100000) {
        return res.status(400).json({ success: false, message: "Enter a credit amount between NPR 10 and NPR 100,000." });
    }
    if (paymentMethod !== "eSewa") {
        return res.status(400).json({ success: false, message: "Choose eSewa for wallet top-up." });
    }
    if (!screenshot) {
        return res.status(400).json({ success: false, message: "Upload your payment screenshot." });
    }

    const topup = await CreditTopup.create({
        userId: req.user._id,
        amount: Math.round(amount),
        paymentMethod,
        screenshot,
        remarks
    });

    req.app.get("io")?.emit("creditTopupCreated", topup);
    return res.status(201).json({ success: true, message: "Credit request submitted for manual verification.", topup });
});

// Admin credit approval queue.
router.get("/admin/topups", requireAdmin, async (req, res) => {
    const topups = await CreditTopup.find()
        .populate("userId", "name email kavroCredits")
        .sort({ createdAt: -1 });
    return res.json({ success: true, topups });
});

router.patch("/admin/topups/:id", requireAdmin, async (req, res) => {
    const status = String(req.body.status || "").trim();
    if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({ success: false, message: "Status must be Approved or Rejected." });
    }

    const topup = await CreditTopup.findOneAndUpdate(
        { _id: req.params.id, status: "Pending" },
        {
            $set: {
                status,
                adminNote: String(req.body.adminNote || "").trim(),
                approvedAt: status === "Approved" ? new Date() : null,
                approvedBy: String(req.admin?.id || "admin")
            }
        },
        { new: true }
    );

    if (!topup) {
        return res.status(409).json({ success: false, message: "This credit request was already processed." });
    }

    if (status === "Approved") {
        await User.findByIdAndUpdate(topup.userId, {
            $inc: { kavroCredits: topup.amount }
        });
    }

    req.app.get("io")?.emit("creditTopupUpdated", topup);
    return res.json({ success: true, message: `Credit request ${status.toLowerCase()}.`, topup });
});

module.exports = router;
