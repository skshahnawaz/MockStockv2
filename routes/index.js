const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance2").default;
const { ensureAuthenticated } = require("../config/auth.js");
const { ObjectId } = require("mongodb");
const User = require("../models/user.js");
const Trade = require("../models/trade.js");
const Holding = require("../models/holding.js");
const LoggedInUser = require("../models/loggedinuser.js");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");

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
  "SHREECEM.NS",
  "SBIN.NS",
  "BPCL.NS",
  "TATACONSUM.NS",
  "BAJFINANCE.NS",
  "COALINDIA.NS",
  "NTPC.NS",
  "DIVISLAB.NS",
  "MARUTI.NS",
  "NESTLEIND.NS",
  "ADANIPORTS.NS",
  "BHARTIARTL.NS",
  "ASIANPAINT.NS",
  "ICICIBANK.NS",
  "TATASTEEL.NS",
  "POWERGRID.NS",
  "HDFCBANK.NS",
  "JSWSTEEL.NS",
  "ITC.NS",
  "SUNPHARMA.NS",
  "KOTAKBANK.NS",
  "BRITANNIA.NS",
  "ONGC.NS",
  "INDUSINDBK.NS",
  "IOC.NS",
];

async function getPrices(symbols) {
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
  // console.log(req.user._id.toString());
  Trade.find({ tradedBy: req.user._id.toString() })
    .sort({ date: -1 })
    .exec(async (err, trades) => {
      if (!trades) {
        res.render("pages/orders", {
          user: req.user,
          // sessionId: req.params.sessid,
          orders: [],
        });
      } else {
        // console.log(trades);
        res.render("pages/orders", {
          user: req.user,
          orders: trades,
          // sessionId: req.params.sessid,
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
          // sessionId: req.params.sessid,
        });
      } else {
        for (let i = 0; i < holdings.length; i++) {
          let memberId = holdings[i].heldBy;
          let registeredUser = await User.findById(memberId.trim());
          let networth = holdings[i].quantity;
          let userHoldings = await Holding.find({
            companyCode: { $ne: "WALLETCASH" },
            heldBy: memberId.trim(),
          });

          // console.log(userHoldings);
          for (let k = 0; k < userHoldings.length; k++) {
            // let latestQuote = await yahooFinance.quote(
            //   userHoldings[k].companyCode
            // );
            // console.log(
            //   userHoldings[k].companyCode +
            //     " Price is : " +
            //     latestQuote.regularMarketPrice
            // );
            // networth +=
            //   userHoldings[k].quantity * latestQuote.regularMarketPrice;
            networth += userHoldings[k].quantity;
          }

          // console.log(networth);
          memberList.push({
            userDetails: registeredUser,
            walletWorth: networth,
          });
        }
        res.render("pages/leaderboard", {
          user: req.user,
          members: memberList,
          sessionId: req.params.sessid,
        });
      }
    });
});

// index page
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  var quotes = [];

  const msg = await getPrices(symbols).then((result) => {
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
        let sessId = uuidv4();
        if (!holding) {
          let newHolding = new Holding({
            heldBy: req.user._id,
            companyCode: "WALLETCASH",
            quantity: 1500000,
          });
          let newLogin = new LoggedInUser({
            userId: req.user._id,
            loginStatus: 1,
            // sessionId: req.user.sessionId,
            sessionId: sessId,
          });
          newHolding.save().then(async (result) => {
            let loginres = await newLogin.save();
            // console.log("New Login status : ", loginres);
            res.render("pages/index4", {
              quotes: quotes,
              marketState: quotes[0].marketState,
              user: req.user,
              holdingAmount: 1500000,
              holdings: [],
              sessionId: sessId,
            });
          });
        } else {
          Holding.find({
            heldBy: req.user._id,
            companyName: { $ne: "#" },
            quantity: { $gte: 1 },
          }).exec(async (err, allHoldings) => {
            // console.log(allHoldings);
            if (!allHoldings) {
              allHoldings = [];
            }
            let loggedInStatus = await LoggedInUser.findOne({
              userId: req.user._id,
            });
            if (!loggedInStatus) {
              let newLogin = new LoggedInUser({
                userId: req.user._id,
                loginStatus: 1,
                sessionId: sessId,
              });
              let loginres = await newLogin.save();

              res.render("pages/index4", {
                quotes: quotes,
                marketState: quotes[0].marketState,
                user: req.user,
                holdingAmount: holding.quantity,
                holdings: allHoldings,
                sessionId: sessId,
              });
            } else {
              LoggedInUser.findOneAndUpdate(
                { userId: req.user._id },
                { loginStatus: 1, sessionId: sessId },
                { new: true }
              ).exec((err, newStatus) => {
                if (err) {
                  console.log(err);
                } else {
                  res.render("pages/index4", {
                    quotes: quotes,
                    marketState: quotes[0].marketState,
                    user: req.user,
                    holdingAmount: holding.quantity,
                    holdings: allHoldings,
                    sessionId: sessId,
                  });
                }
              });
            }
          });
        }
      }
    );
  });

  //   var marketState = quote.marketState;
});

module.exports = router;
