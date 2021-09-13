const mongoose = require("mongoose");

const LoggedInUserSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: String,
    default: "#",
  },
  loginStatus: {
    type: Number,
    default: 0,
  },
  sessionId: {
    type: String,
    default: "#",
  },
});

const LoggedInUser = mongoose.model(
  "LoggedInUser",
  LoggedInUserSchema,
  "LoggedInUsers"
);

module.exports = LoggedInUser;
