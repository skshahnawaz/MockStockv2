const mongoose = require("mongoose");

const HoldingSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  companyName: {
    type: String,
    default: "#",
  },
  companyCode: {
    type: String,
    default: "#",
  },
  quantity: {
    type: Number,
    default: 1,
    min: 0,
  },
  heldBy: {
    type: String,
    default: "#",
  },
});

const Holding = mongoose.model("Holding", HoldingSchema, "Holdings");

module.exports = Holding;
