// -------------------------
// Load Environment & Dependencies
// -------------------------
require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const methodOverride = require("method-override");
const pool = require("./config/db");

// Core Routes
const authRoutes = require("./auth/auth");   
const mainRoutes = require("./routes/routes");

// Helpers & Utils
const cronJobs = require("./cron");
const { ensureAuthenticated, ensureAdmin, getGreeting, contactLimiter } = require("./helpers");
const transporter = require("./config/mailer");
const { services, slides } = require("./statics");

// -------------------------
// App Initialization
// -------------------------
const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// -------------------------
// Global Middleware & Setup
// -------------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// -------------------------
// Session Setup
// -------------------------
app.set("trust proxy", 1);
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

// -------------------------
// Attach user session to templates
// -------------------------
app.use((req, res, next) => {
  if (!req.session.user && !["/login", "/register"].includes(req.path)) {
    req.session.returnTo = req.originalUrl;
  }
  res.locals.user = req.session.user || null;
  next();
});

// Title and Description Defaults
app.use((req, res, next) => {
  res.locals.title = "AICTP Logistics LTD";
  res.locals.description = "AICTP Logistics – trusted logistics, travel, and procurement services.";
  res.locals.user = req.session.user || null;
  next();
});


// -------------------------
// Routes
// -------------------------
app.use("/", authRoutes);
app.use("/", mainRoutes);

// -------------------------
// Start Server
// -------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
