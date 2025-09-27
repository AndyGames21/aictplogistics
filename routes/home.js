const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { getGreeting } = require("../helpers");
const { services, slides } = require("../statics");

// Favicon Fix
router.get("/favicon.ico", (req,res) => res.status(204).end());

// Home & dashboard
router.get("/", async (req, res) => {
  const user = req.session.user || null;
  let bookings = [];
  if (user) {
    try {
      const results = await pool.query(
        "SELECT * FROM bookings WHERE user_id = $1 ORDER BY departure_date DESC",
        [user.id]
      );
      bookings = results.rows.map(b => ({
        ...b,
        status: b.status || "sent",
      }));
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

router.get("/dashboard", (req, res) => res.redirect("/"));
router.get("/services", (req, res) => res.redirect("/#services"));
router.get("/contactUs", (req, res) => res.redirect("/#contactUs"));

module.exports = router;
