const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance2").default;
const { ensureAuthenticated } = require("../config/auth.js");
const { ObjectId } = require("mongodb");
const User = require("../models/user.js");
const Trade = require("../models/trade.js");
const Holding = require("../models/holding.js");

const symbols = [
  "WIPRO.NS",
  "HCLTECH.NS",
  "INFY.NS",
  "RELIANCE.NS",
  "HINDALCO.NS",
  "TECHM.NS",
  "GRASIM.NS",
  "EICHERMOT.NS",
  "CIPLA.NS",
  "M&M.NS",
  "HEROMOTOCO.NS",
  "BAJAJ-AUTO.NS",
  "TATAMOTORS.NS",
  "UPL.NS",
  "HINDUNILVR.NS",
  "ULTRACEMCO.NS",
  "AXISBANK.NS",
  "HDFC.NS",
  "TCS.NS",
  "LT.NS",
  "DRREDDY.NS",
  "HDFCLIFE.NS",
  "SBILIFE.NS",
  "TITAN.NS",
  "BAJAJFINSV.NS",
];

async function getPrices() {
  const result = await yahooFinance.quote(symbols);
  //   console.log(result);
  return result;
}

// login page
router.get("/", async function (req, res) {
  res.render("pages/login");
});

// orders page
router.get("/orders", ensureAuthenticated, async (req, res) => {
  console.log(req.user._id.toString());
  Trade.find({ tradedBy: req.user._id.toString() })
    .sort({ date: -1 })
    .exec(async (err, trades) => {
      if (!trades) {
        res.render("pages/orders", {
          user: req.user,
          orders: [],
        });
      } else {
        console.log(trades);
        res.render("pages/orders", {
          user: req.user,
          orders: trades,
        });
      }
    });
});

// leaderboard page
router.get("/leaderboard", ensureAuthenticated, async (req, res) => {
  Holding.find({ companyCode: "WALLETCASH" })
    .limit(20)
    .sort({ quantity: -1 })
    .exec(async (err, holdings) => {
      let memberList = [];
      if (!holdings) {
        res.render("pages/leaderboard", {
          user: req.user,
          members: [],
        });
      } else {
        for (let i = 0; i < holdings.length; i++) {
          let memberId = holdings[i].heldBy;
          let registeredUser = await User.findById(memberId.trim());
          memberList.push({
            userDetails: registeredUser,
            walletWorth: holdings[i].quantity,
          });
        }
        res.render("pages/leaderboard", {
          user: req.user,
          members: memberList,
        });
      }
    });
});

// index page
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  var quotes = [];

  const msg = await getPrices().then((result) => {
    result.forEach((quote) => {
      quotes.push({
        // id: uuidv4(),
        id: quote.symbol,
        name: quote.longName,
        marketPrice: quote.regularMarketPrice,
        marketPriceChange: quote.regularMarketChange.toFixed(2),
        marketPriceChangePercent: quote.regularMarketChangePercent.toFixed(2),
        badgeClassName: quote.regularMarketChange > 0 ? "success" : "danger",
        arrowType: quote.regularMarketChange > 0 ? "up" : "down",
        symbol: quote.symbol,
        marketState: quote.marketState,
      });
      //   return quotes;
    });

    Holding.findOne({ heldBy: req.user._id, companyCode: "WALLETCASH" }).exec(
      (err, holding) => {
        // console.log(holding);
        if (err) {
          console.log(err);
        }
        if (!holding) {
          let newHolding = new Holding({
            heldBy: req.user._id,
            companyCode: "WALLETCASH",
            quantity: 1500000,
          });
          newHolding.save().then((result) => {
            res.render("pages/index4", {
              quotes: quotes,
              marketState: quotes[0].marketState,
              user: req.user,
              holdingAmount: 1500000,
              holdings: [],
            });
          });
        } else {
          Holding.find({
            heldBy: req.user._id,
            companyName: { $ne: "#" },
          }).exec((err, allHoldings) => {
            console.log(allHoldings);
            res.render("pages/index4", {
              quotes: quotes,
              marketState: quotes[0].marketState,
              user: req.user,
              holdingAmount: holding.quantity,
              holdings: allHoldings,
            });
          });
        }
      }
    );
  });

  //   var marketState = quote.marketState;
});

module.exports = router;
