// ===================
// Load Environment & Dependencies
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
const cron = require('node-cron');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// ===================
// Middleware
// ===================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride('_method'));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Rate Limiter (5 requests/minute)
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests, please try again later." },
});

// ===================
// Session Setup
// ===================
app.set("trust proxy", 1); // Required for Vercel

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    name: "aictp_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
    },
  })
);

// ===================
// Middleware Helpers
// ===================
app.use((req, res, next) => {
  if (!req.session.user && !["/login", "/register"].includes(req.path)) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});

function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

function ensureAdmin(req, res, next) {
  if (req.session.user?.role === "admin") return next();
  res.status(403).send("Access denied. Admins only.");
}

// Attach user to templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ===================
// Helpers
// ===================
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
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ===================
// Static Data
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
// Routes
// ===================

// Dashboard
app.get("/", async (req, res) => {
  const user = req.session.user || null;
  let userBookings = [];

  if (user) {
    try {
      const userBookingsResults = await pool.query(
        "SELECT * FROM bookings WHERE user_id = $1 ORDER BY travel_date DESC",
        [user.id]
      );
      userBookings = userBookingsResults.rows;
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }

  res.render("dashboard", { greeting: getGreeting(), user, bookings: userBookings, services, slides });
});

app.get("/dashboard", (req, res) => res.redirect("/"));
app.get("/services", (req, res) => res.redirect("/#services"));
app.get("/contactUs", (req, res) => res.redirect("/#contactUs"));

// ===================
// Bookings (User & Admin)
// ===================
app.get("/bookings", ensureAuthenticated, async (req, res) => {
  const userBookingsResults = await pool.query(
    "SELECT * FROM bookings WHERE user_id = $1 ORDER BY travel_date DESC", 
    [req.session.user.id]
  );
  const userBookings = userBookingsResults.rows.map(b => ({ ...b, status: b.status || "sent" }));
  res.render("bookings", { user: req.session.user, bookings: userBookings });
});

app.get("/bookingAdmin", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const adminBookingsResults = await pool.query(`
    SELECT b.id AS booking_id, b.destination, b.travel_date, b.details, b.status, 
           u.fullname AS user_name, u.email AS user_email, u.phone AS user_phone
    FROM bookings b
    INNER JOIN users u ON b.user_id = u.id
    ORDER BY b.travel_date DESC
  `);

  const adminBookings = adminBookingsResults.rows.map(row => ({
    id: row.booking_id,
    destination: row.destination,
    travel_date: row.travel_date,
    details: row.details,
    status: row.status || "sent",
    user: { name: row.user_name, email: row.user_email, phone: row.user_phone },
  }));

  res.render("bookingAdmin", { user: req.session.user, bookings: adminBookings });
});

// ===================
// Update Booking Status 
// ===================
app.post('/update-booking/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const status = req.query.status;

  try {
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, bookingId]);
    res.json({ success: true, status }); // respond with JSON
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ success: false, message: 'Server error while updating booking' });
  }
});

// Delete booking
app.delete('/bookings/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const bookingId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true }); // respond with JSON
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ success: false, message: 'Server error while deleting booking' });
  }
});

// ===================
// Book A Trip
// ===================
app.post("/book-trip", ensureAuthenticated, async (req, res) => {
  const { destination, travel_date, details } = req.body;
  const userId = req.session.user.id;

  if (!destination || !travel_date) {
    return res.json({ success: false, message: "Destination and travel date are required." });
  }

  const today = new Date();
  const selectedDate = new Date(travel_date);
  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return res.json({ success: false, message: "Travel date cannot be in the past." });
  }

  try {
    await pool.query(
      "INSERT INTO bookings (user_id, destination, travel_date, details) VALUES ($1, $2, $3, $4)",
      [userId, destination, travel_date, details]
    );
    res.json({ success: true, message: "Booking created successfully." });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ success: false, message: "Server error while creating booking." });
  }
});
// ===================
// Authentication Routes
// ===================
app.get("/register", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password)
    return res.json({ success: false, message: "All fields required." });

  try {
    const emailCheckResults = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (emailCheckResults.rows.length > 0)
      return res.json({ success: false, message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (fullname, email, phone, password) VALUES ($1, $2, $3, $4)",
      [name, email, phone, hashedPassword]
    );

    res.json({ success: true, redirect: "/login" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Database error." });
  }
});

// Login
app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Both fields required." });
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

    // Login successful
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
    console.error("Login error:", error);

    // Always ensure response is sent once
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
});

// ===================
// Profile Management
// ===================
app.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.session.user });
});

app.post("/profile/update", ensureAuthenticated, async (req, res) => {
  const { name, phone, password } = req.body;
  const userId = req.session.user.id;

  if (!name && !phone && !password)
    return res.json({ success: false, message: "Please fill in at least one field." });

  try {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (name) {
      fields.push(`fullname = $${paramIndex++}`);
      params.push(name);
    }

    if (phone) {
      fields.push(`phone = $${paramIndex++}`);
      params.push(phone);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push(`password = $${paramIndex++}`);
      params.push(hashedPassword);
    }

    const updateProfileQuery = `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex}`;
    params.push(userId);

    await pool.query(updateProfileQuery, params);

    if (name) req.session.user.name = name;
    if (phone) req.session.user.phone = phone;

    res.json({ success: true, message: "Profile updated successfully." });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.json({ success: false, message: "Error updating profile." });
  }
});

app.post("/delete-profile", async (req, res) => {
  try {
    const userId = req.session.user.id;
    if (!userId) return res.status(401).send("Unauthorized");

    const deleteProfileResult = await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    if (deleteProfileResult.rowCount > 0) {
      req.session.destroy();
      res.redirect("/");
    } else {
      res.status(404).send("User not found.");
    }
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ===================
// User Management (Admin Only)
// ===================
app.get("/userAdmin", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const adminUsersResults = await pool.query(
      "SELECT id, fullname, email, phone, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.render("adminUsers", { user: req.session.user, users: adminUsersResults.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/delete-user/:id", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const userId = req.params.id;
  if (req.session.user.id.toString() === userId) {
    return res.status(400).send("You cannot delete your own account.");
  }

  try {
    const deleteUserResult = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    if (deleteUserResult.rowCount === 0) {
      return res.status(404).send("User not found.");
    }
    res.redirect("/userAdmin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post('/promote-user/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', userId]);
    res.redirect('/userAdmin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during promotion');
  }
});

// ===================
// Miscellaneous
// ===================
app.post("/contactUs", contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    await pool.query(
      "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );

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
    console.error(err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===================
// Automatic Cleanup for Expired Bookings
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
            <p>If you still need to travel, please make a new booking or contact us at info@aictp.com.ng. Thanks!</p>
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
// Start Server
// ===================
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
