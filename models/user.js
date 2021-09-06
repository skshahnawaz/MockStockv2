const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  eventsRegistered: {
    type: [String],
    default: ["#"],
  },
  institution: {
    type: String,
    default: "#",
  },
  rollNumber: {
    type: String,
    default: "#",
  },
  phone: {
    type: String,
    default: "#",
  },
  isStudent: {
    type: String,
    default: true,
  },
  userType: {
    type: String,
    default: "participant",
  },
  referralCode: {
    type: String,
    default: "#",
  },
  discount: {
    type: Number,
    default: 0,
  },
  isJU: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: String,
    default: "#",
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model("User", UserSchema, "Users");

module.exports = User;
