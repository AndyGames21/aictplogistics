const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const transporter = require("../config/mailer"); // assuming you have this set up
const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

// ---- 1. User Management (Admin Only) ----
router.get("/userAdmin", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const results = await pool.query(
      "SELECT id, fullname, email, phone, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.render("adminUsers", {
      user: req.session.user,
      users: results.rows,
      title: "User Management | AICTP Logistics LTD",
      description:
        "Admin User Management - manage user accounts and roles.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Server Error");
  }
});

router.post("/delete-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.params.id;
  if (req.session.user.id.toString() === userId) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found." });
    res.redirect("/userAdmin");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

router.post("/promote-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.params.id;
  if (req.session.user.id.toString() === userId) {
    return res.status(400).json({ error: "You cannot promote your own account." });
  }
  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", ["admin", userId]);
    res.redirect("/userAdmin");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during promotion" });
  }
});

router.post("/demote-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.params.id;
  if (req.session.user.id.toString() === userId) {
    return res.status(400).json({ error: "You cannot demote your own account." });
  }
  try {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", ["user", userId]);
    res.redirect("/userAdmin");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during demotion" });
  }
});

// ---- 2. Booking Management (Admin Only) ----
router.get("/bookingAdmin", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const results = await pool.query(`
      SELECT b.id AS booking_id, b.origin, b.destination, b.departure_date, b.return_date, b.flight_time,
             b.travel_class, b.adult_passengers, b.child_passengers, b.additional_details, b.status,
             u.fullname AS user_name, u.email AS user_email, u.phone AS user_phone
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      ORDER BY b.departure_date DESC
    `);

    const adminBookings = results.rows.map(row => ({
      id: row.booking_id,
      origin: row.origin,
      destination: row.destination,
      departure_date: row.departure_date,
      return_date: row.return_date,
      flight_time: row.flight_time,
      travel_class: row.travel_class,
      adult_passengers: row.adult_passengers,
      child_passengers: row.child_passengers,
      additional_details: row.additional_details,
      status: row.status || "sent",
      user: { name: row.user_name, email: row.user_email, phone: row.user_phone },
    }));

    res.render("bookingAdmin", {
      user: req.session.user,
      bookings: adminBookings,
      title: "All Bookings - Admin | AICTP Logistics LTD",
      description: "Admin Booking Management - view and manage all user bookings.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading bookings.");
  }
});

router.post("/update-booking/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const status = req.query.status;

  try {
    const bookingResult = await pool.query(
      `SELECT b.id, b.destination, b.departure_date, b.return_date, u.email, u.fullname
       FROM bookings b INNER JOIN users u ON b.user_id = u.id WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return res.send("Booking not found.");
    }

    const booking = bookingResult.rows[0];
    await pool.query("UPDATE bookings SET status = $1 WHERE id = $2", [status, bookingId]);

    let subject, message;
    if (status === "processing") {
      subject = `Your Booking is Being Processed`;
      message = `
        <p>Hi ${booking.fullname},</p>
        <p>Your booking for <strong>${booking.destination}</strong> on <strong>${new Date(booking.departure_date).toLocaleDateString()}</strong> is now <strong>being processed</strong>.</p>
        <p>We will notify you once it's confirmed.</p>
        <p>– AICTP Logistics Team</p>`;
    } else if (status === "processed") {
      subject = `Your Booking is Confirmed`;
      message = `
        <p>Hi ${booking.fullname},</p>
        <p>Great news! Your booking has been <strong>processed and confirmed</strong>.</p>
        <p>You will be contacted about your travel details.</p>
        <p>– AICTP Logistics Team</p>`;
    }

    if (subject && message) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.email,
        subject,
        html: message,
      });
    }

    res.redirect(`/bookingAdmin`);
  } catch (err) {
    console.error(err);
    res.send("Error updating booking status.");
  }
});

router.post("/send-message/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const { message } = req.body;

  try {
    const result = await pool.query(
      `SELECT b.id, b.origin, b.destination, u.fullname, u.email
       FROM bookings b
       INNER JOIN users u ON b.user_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Booking not found");
    }

    const booking = result.rows[0];

    await transporter.sendMail({
      from: `"AICTP Admin" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Message about your booking (${booking.origin} → ${booking.destination})`,
      html: `
        <p>Hi ${booking.fullname},</p>
        <p>${message}</p>
        <p>– AICTP Logistics Admin</p>
      `,
    });

    res.redirect("/bookingAdmin");
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).send("Error sending message");
  }
});

router.delete("/bookings/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const bookingId = req.params.id;
  try {
    const result = await pool.query("DELETE FROM bookings WHERE id = $1", [bookingId]);
    if (result.rowCount === 0) return res.send("Booking not found.");
    res.redirect("/bookingAdmin");
  } catch (err) {
    console.error(err);
    res.send("Error deleting booking.");
  }
});

module.exports = router;
