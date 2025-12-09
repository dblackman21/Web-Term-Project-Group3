const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth")

// Public routes
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// Private routes, protected by middleware
router.get("/profile", authMiddleware, userController.getProfile);

module.exports = router;

