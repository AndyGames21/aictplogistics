const express = require("express");
const router = express.Router();

// Logout
router.get("/", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
    