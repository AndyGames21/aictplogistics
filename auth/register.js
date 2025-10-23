const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const router = express.Router();

// Register Page
router.get("/", (req, res) => res.render("register"));

// Handle Registration
router.post("/", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const emailCheckResults = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (emailCheckResults.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (fullname, email, phone, password) VALUES ($1, $2, $3, $4)",
      [name, email, phone, hashedPassword]
    );

    res.status(200).json({ success: true, message: "Registration successful.", redirect: "/login" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error. Please try again later." });
  }
});

module.exports = router;
