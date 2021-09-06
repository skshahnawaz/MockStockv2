const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  orderMode: {
    type: String,
    default: "CNC",
  },
  orderType: {
    type: String,
    default: "MARKET",
  },
  companyName: {
    type: String,
    default: "#",
  },
  companyCode: {
    type: String,
    default: "#",
  },
  transactionType: {
    type: String,
    default: "BUY",
  },
  quantity: {
    type: Number,
    default: 1,
  },
  price: {
    type: Number,
    default: 1,
  },
  tradedBy: {
    type: String,
    default: "#",
  },
});

const Trade = mongoose.model("Trade", TradeSchema, "Trades");

module.exports = Trade;
