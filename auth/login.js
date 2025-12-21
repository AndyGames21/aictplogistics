const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const router = express.Router();

// Login Page
router.get("/", (req, res) => {
  if(req.session.user){
    res.status(403).redirect("/dashboard");
  }
  else{
    res.render("login")
  }
});

// Handle Login
router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Both email and password are required." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.json({ success: false, message: "Invalid email or password." });
    }

    req.session.user = {
      id: user.id,
      name: user.fullname,
      email: user.email,
      phone: user.phone,
      role: user.role || "user",
    };

    const redirectTo = req.session.returnTo || "/dashboard";
    delete req.session.returnTo;

    return res.json({ success: true, redirect: redirectTo });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: "Server error. Please try again." });
  }
});


module.exports = router;