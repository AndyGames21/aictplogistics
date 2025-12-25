// ===================
// Helper Functions
// ===================
const rateLimit = require("express-rate-limit");

// Authentication Check
function ensureAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// Admin Check
function ensureAdmin(req, res, next) {
  if (req.session.user?.role === "admin") return next();
  res.status(403).send("Access denied. Admins only.");
}

// Greeting (Replaced with seasonal greetings)
function getGreeting() {
  // const hour = new Date().getHours();
  // if (hour < 11) return "Good Morning";
  // if (hour < 17) return "Good Afternoon";
  // return "Good Evening";
  return "❄️🎁 Merry Christmas!";
}

// Rate Limiter
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests, please try again later." },
});


module.exports = { ensureAuthenticated, ensureAdmin, getGreeting, contactLimiter };