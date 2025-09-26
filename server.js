// ===================
// 1. Load Environment & Dependencies
// ===================
require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const pool = require("./config/db");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const xss = require("xss");
const cron = require("node-cron");
const methodOverride = require("method-override");

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// ===================
// 2. Global Middleware & Setup
// ===================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// Rate Limiter
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests, please try again later." },
});

// ===================
// 3. Session Setup
// ===================
app.set("trust proxy", 1);
app.use(
  session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    name: "aictp_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
    },
  })
);

// Attach user session to templates
app.use((req, res, next) => {
  if (!req.session.user && !["/login", "/register"].includes(req.path)) {
    req.session.returnTo = req.originalUrl;
  }
  res.locals.user = req.session.user || null;
  next();
});

// ===================
// 4. Helper Functions
// ===================
function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

function ensureAdmin(req, res, next) {
  if (req.session.user?.role === "admin") return next();
  res.status(403).send("Access denied. Admins only.");
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ===================
// 5. Static Data
// ===================
  const services = [
    { title: "VISA Assistance", description: "Fast and reliable support to process your travel visas seamlessly.", img: "services1.jpg" , link: "#contactUs"},
    { title: "Meet and Greet Services", description: "Professional assistance to welcome and guide you through airports.", img: "services2.jpg", link: "#contactUs" },
    { title: "Hotel Bookings", description: "Find and reserve top-quality hotels for your travels with ease.", img: "services3.jpg", link: "#contactUs" },
    { title: "International Tickets And Local Tickets", description: "Book flights to destinations be it local or internationally.", img: "services4.jpg" , link: "/bookings"},
    { title: "Travel and Tour Packages", description: "Discover amazing destinations with our curated travel packages.", img: "services5.jpg", link: "#contactUs" },
    { title: "Cruises", description: "Plan your perfect getaway with our luxury cruise options.", img: "services6.jpg" , link: "#contactUs"},
    { title: "International School Placements", description: "Helping students find the right international schools for their education.", img: "services7.jpg" , link: "#contactUs"},
    { title: "Local And Foreign Procurements", description: "Efficient sourcing and procurement of goods and services, both locally and internationally, to meet your business and travel needs with speed and reliability.", img: "services8.jpg" , link: "#contactUs"},
    { title: "Logistics Services", description: "Comprehensive and efficient logistics solutions designed to optimize supply chains, ensure timely deliveries, and maintain the highest standards of reliability and professionalism.", img: "services9.jpg", link: "#contactUs"}
  ];

  const slides = [
    { img: "slide1.jpg", title: "Discover Lagos", text: "Book your local flight today!" },
    { img: "slide2.jpg", title: "Adventure in Paris", text: "International flights made easy." },
    { img: "slide3.jpg", title: "Explore Qatar", text: "Luxury trips for everyone." },
    { img: "slide4.jpg", title: "New York Awaits", text: "Fly across the globe with ease." },
    { img: "slide5.jpg", title: "Relax in London", text: "Enjoy your perfect vacation." },
    { img: "slide6.jpg", title: "Fly to Abuja", text: "Local or international trips, we have it all!" },
    { img: "slide7.jpg", title: "Visit Canada", text: "Book your next adventure now!" },
  ];

// ===================
// 6. Routes
// ===================
// Favicon.ico Issue Fix
app.get('/favicon.ico', (req,res) => {
  res.status(204).end()
})
// ---- 1. Home & Dashboard ----
app.get("/", async (req, res) => {
  const user = req.session.user || null;
  let userBookings = [];

  if (user) {
    try {
      const results = await pool.query(
        "SELECT * FROM bookings WHERE user_id = $1 ORDER BY departure_date DESC",
        [user.id]
      );
      userBookings = results.rows;
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }

  res.render("dashboard", { greeting: getGreeting(), user, bookings: userBookings, services, slides, title:"Dashboard | AICTP Logistics LTD", description: "AICTP Logistics - trusted logistics, travel, and procurement services." });
});

app.get("/dashboard", (req, res) => res.redirect("/"));
app.get("/services", (req, res) => res.redirect("/#services"));
app.get("/contactUs", (req, res) => res.redirect("/#contactUs"));


// ---- 2. Authentication ----
app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
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

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Both email and password are required." });
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

    res.status(200).json({ success: true, redirect: redirectTo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

app.get("/logout", (req, res) => req.session.destroy(() => res.redirect("/")));


// ---- 3. Profile Management ----
app.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.session.user });
});

app.post("/profile/update", ensureAuthenticated, async (req, res) => {
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

app.post("/delete-profile", async (req, res) => {
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


// ---- 4. Bookings ----
app.get("/bookings", ensureAuthenticated, async (req, res) => {
  const results = await pool.query(
    "SELECT * FROM bookings WHERE user_id = $1 ORDER BY departure_date DESC",
    [req.session.user.id]
  );
  const userBookings = results.rows.map(b => ({ ...b, status: b.status || "sent" }));
  res.render("bookings", { user: req.session.user, bookings: userBookings });
});

app.get("/bookingAdmin", ensureAuthenticated, ensureAdmin, async (req, res) => {
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
    origin : row.origin,
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

  res.render("bookingAdmin", { user: req.session.user, bookings: adminBookings, title: "All Bookings - Admin | AICTP Logistics LTD", description: "Admin Booking Management - view and manage all user bookings." });
});

app.post("/book-trip", ensureAuthenticated, async (req, res) => {
  try {
    const { origin, destination, departure_date, return_date, flight_time, travel_class,
      adult_passengers, child_passengers, additional_details } = req.body;

    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized. Please log in." });
    }

    if (!origin || !destination || !departure_date || !flight_time || !adult_passengers) {
      return res.status(400).json({
        success: false,
        error: "Origin, Destination, Departure date, Number of passengers, and Flight time are required."
      });
    }

    const today = new Date();
    const depDate = new Date(departure_date);
    const retDate = return_date ? new Date(return_date) : null;
    today.setHours(0, 0, 0, 0); depDate.setHours(0, 0, 0, 0);

    if (depDate < today) {
      return res.status(400).json({ success: false, error: "Departure date cannot be in the past." });
    }
    if (retDate && retDate < depDate) {
      return res.status(400).json({ success: false, error: "Return date cannot be earlier than departure date." });
    }

    const insertQuery = `
      INSERT INTO bookings (
        user_id, origin, destination, departure_date, return_date,
        flight_time, travel_class, adult_passengers, child_passengers, additional_details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, created_at;
    `;

    const insertValues = [
      userId, origin.trim(), destination.trim(), departure_date, return_date || null,
      flight_time, travel_class || "economy", parseInt(adult_passengers, 10),
      parseInt(child_passengers || 0, 10), additional_details?.trim() || null
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
      additional_details: additional_details?.trim() || "No additional details provided."
    };

    const userQuery = `SELECT fullname, phone, email FROM users WHERE id = $1`;
    const userResult = await pool.query(userQuery, [userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ success: false, error: "User not found." });

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
          <p><strong>Phone:</strong> ${user.phone || N/A} </p>
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

app.post("/update-booking/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
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
      await transporter.sendMail({ from: process.env.EMAIL_USER, to: booking.email, subject, html: message });
    }

    res.redirect(`/bookingAdmin`);
  } catch (err) {
    console.error(err);
    res.send("Error updating booking status.");
  }
});
app.post('/send-message/:id', async (req, res) => {
  const bookingId = req.params.id;
  const { message } = req.body;

  // Find the booking
  const booking = await Booking.findById(bookingId).populate('user');

  if (!booking) {
    return res.status(404).send("Booking not found");
  }

  await transporter.sendMail({
    from: '"Admin" <process.env.EMAIL_USER>',
    to: booking.user.email,
    subject: `Message about your booking (${booking.origin} → ${booking.destination})`,
    text: message,
  });

  res.redirect('/bookingAdmin');
});


app.delete("/bookings/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
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


// ---- 5. User Management (Admin Only) ----
app.get("/userAdmin", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const results = await pool.query("SELECT id, fullname, email, phone, role, created_at FROM users ORDER BY created_at DESC");
    res.render("adminUsers", { user: req.session.user, users: results.rows, title:"User Management | AICTP Logistics LTD", description: "Admin User Management - manage user accounts and roles." });
  } catch (err) {
    console.error(err);
    res.status(500).json("Server Error");
  }
});

app.post("/delete-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
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

app.post("/promote-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
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

app.post("/demote-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
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


// ---- 6. Contact Form ----
app.post("/contactUs", contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    await pool.query("INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)", [name, email, message]);
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Us Message from ${name}`,
      html: `<h2>New Contact Submission</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
    });

    res.json({ success: true, message: "Message received! We will get back to you soon." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
});

// ===================
// 7. Automatic Cleanup for Expired Bookings
// ===================
  cron.schedule("0 0 * * *", async () => {
    try {
      const expiredBookingsResults = await pool.query(`
        SELECT b.id, b.destination, b.travel_date, u.email, u.fullname
        FROM bookings b
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.travel_date < CURRENT_DATE
      `);

      if (expiredBookingsResults.rows.length > 0) {
        for (const expiredBooking of expiredBookingsResults.rows) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: expiredBooking.email,
            subject: "Your Booking Has Expired",
            html: `
              <p>Hi ${expiredBooking.fullname},</p>
              <p>Your booking for <strong>${expiredBooking.destination}</strong> scheduled on <strong>${new Date(expiredBooking.travel_date).toLocaleDateString()}</strong> has expired and has been removed from our system.</p>
              <p>We hope we were helpful to you.
              <p>Contact us at info@aictp.com.ng for more enquiries. Thanks!</p>
              <p>– AICTP Logistics Team</p>
            `,
          });
        }

        await pool.query("DELETE FROM bookings WHERE travel_date < CURRENT_DATE");
        console.log(`[Cleanup Job] Deleted ${expiredBookingsResults.rows.length} expired bookings and notified users.`);
      }
    } catch (err) {
      console.error("[Cleanup Job] Error deleting expired bookings:", err);
    }
  });
// ===================
// 8. Start Server For Local Development
// ===================
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
