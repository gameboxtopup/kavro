const express = require("express");
const jwt = require("jsonwebtoken");
const { lookupFreeFirePlayer } = require("../services/freeFireVerifier");

const router = express.Router();
const recentRequests = new Map();

router.get("/free-fire/config", (req, res) => {
    const enabled = Boolean(
        process.env.FF_LOOKUP_API_KEY && process.env.JWT_SECRET
    );

    return res.json({ success: true, enabled });
});

function isRateLimited(ip) {
    const windowStart = Date.now() - 60_000;
    const previous = (recentRequests.get(ip) || [])
        .filter(timestamp => timestamp > windowStart);

    if (previous.length >= 5) {
        recentRequests.set(ip, previous);
        return true;
    }

    previous.push(Date.now());
    recentRequests.set(ip, previous);
    return false;
}

router.post("/free-fire/verify", async (req, res) => {
    const requester = req.ip || req.socket.remoteAddress || "unknown";

    if (isRateLimited(requester)) {
        return res.status(429).json({
            success: false,
            message: "Too many verification attempts. Please wait one minute."
        });
    }

    try {
        const player = await lookupFreeFirePlayer(req.body.uid);
        const verificationToken = jwt.sign(
            {
                purpose: "free-fire-uid-verification",
                uid: player.uid,
                playerName: player.playerName,
                playerRegion: player.playerRegion
            },
            process.env.JWT_SECRET,
            { expiresIn: "30m" }
        );

        return res.json({
            success: true,
            ...player,
            verificationToken
        });
    } catch (error) {
        if (error.code === "INVALID_UID_FORMAT") {
            return res.status(400).json({ success: false, message: error.message });
        }

        if (error.code === "LOOKUP_NOT_CONFIGURED") {
            return res.status(503).json({
                success: false,
                message: "UID verification is temporarily unavailable."
            });
        }

        if (
            error.code === "PLAYER_NOT_FOUND" ||
            error.code === "WRONG_REGION" ||
            error.response?.status === 402 ||
            error.response?.status === 404
        ) {
            return res.status(404).json({
                success: false,
                message: error.code === "WRONG_REGION"
                    ? error.message
                    : "No Bangladesh-server player was found for this UID."
            });
        }

        if (error.response?.status === 429) {
            return res.status(429).json({
                success: false,
                message: "UID lookup limit reached. Please try again shortly."
            });
        }

        console.error("FREE FIRE UID LOOKUP ERROR:", error.message);
        return res.status(502).json({
            success: false,
            message: "Could not verify this UID right now. Please try again."
        });
    }
});

module.exports = router;
