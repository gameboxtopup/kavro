const express = require("express");
const router = express.Router();

const {
    createAdmin,
    loginAdmin,
    changePassword
} = require("../controllers/adminController");

// Register Admin (Only use once during setup)
router.post("/register", createAdmin);

// Admin Login
router.post("/login", loginAdmin);

// Change Password
router.put("/change-password", changePassword);

module.exports = router;