const express = require("express");
const router = express.Router();

// Import sub-route modules
const authRoutes = require("../auth/auth");
const contactRoutes = require("./contact");
const bookingRoutes = require("./bookings");
const adminRoutes = require("./admin");

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
router.use("/admin", adminRoutes);


// ====================
// Root/Homepage
// ====================
router.get("/", (req, res) => {
  res.render("dashboard", {
    user: req.session.user || null,
    title: "AICTP Logistics LTD",
    description: "Welcome to AICTP Logistics LTD – Your trusted logistics and travel partner."
  });
});


module.exports = router;
