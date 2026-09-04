const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

async function requireAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Admin authorization required."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === "admin") {
            req.admin = decoded;
            return next();
        }

        // Compatibility for admin tokens issued before roles were added.
        if (!decoded.role && await Admin.exists({ _id: decoded.id })) {
            req.admin = { ...decoded, role: "admin" };
            return next();
        }

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required."
            });
        }

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin session."
        });
    }
}

module.exports = { requireAdmin };
