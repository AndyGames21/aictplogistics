const express = require("express");
const router = express.Router();
const { getGreeting } = require("../helpers");
const { slides, services } = require("../statics");    

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
router.get("/", async (req, res) => {
  const user = req.session.user || null;
  let bookings = [];

  if (user) {
    try {
      const results = await pool.query(
        "SELECT * FROM bookings WHERE user_id = $1 ORDER BY departure_date DESC",
        [user.id]
      );
      bookings = results.rows;
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }

  res.render("dashboard", { 
    greeting: getGreeting(),
    user, 
    bookings,
    services,
    slides,
    title: "Dashboard | AICTP Logistics LTD",
    description: "AICTP Logistics - trusted logistics, travel, and procurement services."
  });
});

module.exports = router;
