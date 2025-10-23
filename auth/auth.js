const express = require("express");
const router = express.Router();

const registerRoute = require("./register");
const loginRoute = require("./login");
const logoutRoute = require("./logout");

// Mount sub-routes
router.use("/register", registerRoute);
router.use("/login", loginRoute);
router.use("/logout", logoutRoute);

module.exports = router;