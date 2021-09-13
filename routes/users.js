const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LoggedInUser = require("../models/loggedinuser.js");

// login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, next);
});

//logout
router.get("/logout", (req, res) => {
  // console.log(req.user._id);
  LoggedInUser.findOneAndUpdate(
    { userId: req.user._id },
    { loginStatus: 0 },
    { new: true }
  ).exec((err, newStatus) => {
    if (err) {
      console.log(err);
    } else {
      req.logout();
      req.flash("success_msg", "Now logged out");
      res.redirect("/users/login");
    }
  });
});

// login page
router.get("/login", async function (req, res) {
  res.render("pages/login");
});

module.exports = router;
