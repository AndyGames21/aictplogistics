const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { ensureAuthenticated } = require("../helpers");

const router = express.Router();

// Profile page
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.session.user });
});

// Update profile
router.post("/update", ensureAuthenticated, async (req, res) => {
  const { name, phone, email, password } = req.body;
  const userId = req.session.user.id;

  if (!name && !phone && !email && !password) {
    return res.status(400).json({ success: false, message: "Please fill in at least one field." });
  }

  try {
    if (email) {
      const existing = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, userId]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ success: false, message: "Email is already registered." });
      }
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (name) { fields.push(`fullname = $${idx++}`); params.push(name); }
    if (phone) { fields.push(`phone = $${idx++}`); params.push(phone); }
    if (email) { fields.push(`email = $${idx++}`); params.push(email); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`); params.push(hashed);
    }

    params.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}`, params);

    if (name) req.session.user.name = name;
    if (phone) req.session.user.phone = phone;
    if (email) req.session.user.email = email;

    res.status(200).json({ success: true, message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating profile." });
  }
});

// Delete profile
router.post("/delete", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    if (!userId) return res.status(401).send("Unauthorized");

    const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    if (result.rowCount > 0) {
      req.session.destroy();
      res.redirect("/");
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
