const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureAuthenticated } = require("../helpers");
const transporter = require("../config/mailer");

// ---- Get Bookings for Logged-in User ----
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const results = await pool.query(
      "SELECT * FROM bookings WHERE user_id = $1 ORDER BY departure_date DESC",
      [req.session.user.id]
    );

    const userBookings = results.rows.map(b => ({
      ...b,
      status: b.status || "sent",
    }));

    res.render("bookings", { user: req.session.user, bookings: userBookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).send("Server error while fetching bookings.");
  }
});

// ---- Book a Trip ----
router.post("/book-trip", ensureAuthenticated, async (req, res) => {
  try {
    const {
      origin,
      destination,
      departure_date,
      return_date,
      flight_time,
      travel_class,
      adult_passengers,
      child_passengers,
      additional_details,
    } = req.body;

    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized. Please log in." });
    }

    if (!origin || !destination || !departure_date || !flight_time || !adult_passengers) {
      return res.status(400).json({
        success: false,
        error: "Origin, Destination, Departure date, Number of passengers, and Flight time are required.",
      });
    }

    const today = new Date();
    const depDate = new Date(departure_date);
    const retDate = return_date ? new Date(return_date) : null;
    today.setHours(0, 0, 0, 0);
    depDate.setHours(0, 0, 0, 0);

    if (depDate < today) {
      return res.status(400).json({ success: false, error: "Departure date cannot be in the past." });
    }
    if (retDate && retDate < depDate) {
      return res.status(400).json({ success: false, error: "Return date cannot be earlier than departure date." });
    }

    // Insert booking
    const insertQuery = `
      INSERT INTO bookings (
        user_id, origin, destination, departure_date, return_date,
        flight_time, travel_class, adult_passengers, child_passengers, additional_details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, created_at;
    `;

    const insertValues = [
      userId,
      origin.trim(),
      destination.trim(),
      departure_date,
      return_date || null,
      flight_time,
      travel_class || "economy",
      parseInt(adult_passengers, 10),
      parseInt(child_passengers || 0, 10),
      additional_details?.trim() || null,
    ];

    const { rows } = await pool.query(insertQuery, insertValues);
    const bookingId = rows[0].id;

    const booking = {
      id: bookingId,
      origin,
      destination,
      departure_date,
      return_date,
      flight_time,
      travel_class: travel_class || "Economy",
      adult_passengers: parseInt(adult_passengers, 10),
      child_passengers: parseInt(child_passengers || 0, 10),
      additional_details: additional_details?.trim() || "No additional details provided.",
    };

    // Fetch user info
    const userQuery = `SELECT fullname, phone, email FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ success: false, error: "User not found." });

    // Send confirmation emails
    try {
      await transporter.sendMail({
        from: `"AICTP Logistics" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your Booking Request Has Been Received",
        html: `
          <p>Hi ${user.fullname},</p>
          <p>We have successfully received your booking request:</p>
          <ul>
            <li><strong>From:</strong> ${booking.origin}</li>
            <li><strong>To:</strong> ${booking.destination}</li>
            <li><strong>Departure:</strong> ${new Date(booking.departure_date).toLocaleDateString()}</li>
            ${
              booking.return_date
                ? `<li><strong>Return:</strong> ${new Date(booking.return_date).toLocaleDateString()}</li>`
                : ""
            }
            <li><strong>Class:</strong> ${booking.travel_class}</li>
            <li><strong>Passengers:</strong> Adults (${booking.adult_passengers}), Children (${booking.child_passengers})</li>
          </ul>
          <p>We will notify you once it has been processed.</p>
          <p>– AICTP Logistics Team</p>
        `,
      });

      await transporter.sendMail({
        from: `"AICTP Logistics System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `New Booking Request from ${user.fullname}`,
        html: `
          <h2>New Booking Request</h2>
          <p><strong>User:</strong> ${user.fullname} (${user.email})</p>
          <p><strong>Phone:</strong> ${user.phone || "N/A"}</p>
          <ul>
            <li><strong>From:</strong> ${booking.origin}</li>
            <li><strong>To:</strong> ${booking.destination}</li>
            <li><strong>Departure:</strong> ${new Date(booking.departure_date).toLocaleDateString()}</li>
            ${
              booking.return_date
                ? `<li><strong>Return:</strong> ${new Date(booking.return_date).toLocaleDateString()}</li>`
                : ""
            }
            <li><strong>Class:</strong> ${booking.travel_class}</li>
            <li><strong>Adults:</strong> ${booking.adult_passengers}</li>
            <li><strong>Children:</strong> ${booking.child_passengers}</li>
            <li><strong>Additional Details:</strong> ${booking.additional_details || "None"}</li>
          </ul>
          <p><a href="${process.env.APP_URL}/bookingAdmin">Open Admin Panel</a></p>
        `,
      });
    } catch (emailErr) {
      console.error("Failed to send one or more emails:", emailErr.message);
    }

    res.json({ success: true, message: "Booking request sent successfully!", bookingId });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ success: false, error: "Server error while creating booking." });
  }
});

module.exports = router;
