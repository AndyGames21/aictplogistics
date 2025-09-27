const express = require("express");
const router = express.Router();

// Import sub-route modules
const home = require("./home");
const authRoutes = require("../auth/auth");
const contactRoutes = require("./contact");
const bookingRoutes = require("./bookings");
const adminRoutes = require("./admin");
const { ensureAuthenticated } = require("../helpers");
const profileRoutes = require("./profile");

// ====================
// Attach Routers
// ====================

// Authentication (register, login, logout)
router.use("/", authRoutes);

// Contact form routes
router.use("/contact", contactRoutes);

// Bookings (user-facing)
router.use("/bookings", bookingRoutes);

// Admin dashboard
router.use("/", adminRoutes);

// Home and static pages
router.use("/", home);

// Profile
router.use("/", profileRoutes);

module.exports = router;
