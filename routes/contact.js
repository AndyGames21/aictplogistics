const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { contactLimiter } = require("../helpers");
const transporter = require("../mail");

// ---- Contact Form ----
router.post("/", contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Save message to DB
    await pool.query(
      "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );

    // Send notification email
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Us Message from ${name}`,
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    res.json({ success: true, message: "Message received! We will get back to you soon." });
  } catch (err) {
    console.error("Error handling contact form:", err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
});

module.exports = router;
