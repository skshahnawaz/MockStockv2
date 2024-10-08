//-*-*-*-*-*-*-*-* Module imports start *-*-*-*-*-*-*-*
const yahooFinance = require("yahoo-finance2").default;
var express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");
var app = express();
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
require("./config/passport")(passport);

const socket = require("socket.io");
// var Chart = require("chart.js");
const Trade = require("./models/trade.js");
const Holding = require("./models/holding.js");
const LoggedInUser = require("./models/loggedinuser.js");

app.use(express.json()); //Used to parse JSON bodies

//-*-*-*-*-*-*-*-* Module imports end *-*-*-*-*-*-*-*

//-*-*-*-*-*-*-*-* Price Update Section starts *-*-*-*-*-*-*-*

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

// Function to fetch the prices from Yahoo Finance API
async function getPrices() {
  const result = await yahooFinance.quote(symbols);
  //   console.log(result);
  return result;
}

//-*-*-*-*-*-*-*-* Price Update Section ends *-*-*-*-*-*-*-*

//-*-*-*-*-*-*-*-* Mongoose connection *-*-*-*-*-*-*-*
mongoose
  .connect(
    "mongodb+srv://juecell:" +
      encodeURIComponent("Mongo@123") +
      "@ju-ecellcluster.m8cyb.mongodb.net/esummit2021?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("connected to DB!"))
  .catch((err) => console.log(err));

//-*-*-*-*-*-*-*-* Mongoose connection *-*-*-*-*-*-*-*

//-*-*-*-*-*-*-*-* Express server *-*-*-*-*-*-*-*

// set the view engine to ejs
app.set("view engine", "ejs");

// serve static assets
app.use(express.static(__dirname + "/views"));

//BodyParser
app.use(express.urlencoded({ extended: false }));

//express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

//use flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//Routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));

const port = process.env.PORT; //Uncomment if env configured
// const port = 8080; //Uncomment for Local Machine

const server = app.listen(port, () => {
  console.log(`listening on *:${port}`);
});

//-*-*-*-*-*-*-*-* Express server *-*-*-*-*-*-*-*

//-*-*-*-*-*-*-*-* Database Bulk Operation Temporary Code *-*-*-*-*-*-*-*

// try {
//   Holding.deleteMany({ heldBy: "613b70d39db3b600119ca340" }, function (err) {
//     if (err) console.log(err);
//     console.log("Successful deletion");
//   });
// } catch (e) {
//   console.log(e);
// }

//-*-*-*-*-*-*-*-* Database Bulk Operation Temporary Code *-*-*-*-*-*-*-*

const io = socket(server);

io.on("connection", async function (socket) {
  console.log("user connected : ", socket.id);

  socket.on("transact", async (transaction) => {
    let {
      ttype,
      symbol,
      name,
      quantity,
      lotSize,
      mode,
      atPrice,
      otype,
      balance,
      userID,
      usersessionId,
    } = transaction;

    console.log("User ID : ", userID);

    let loggedIn = await LoggedInUser.findOne({
      userId: userID,
    });

    let loggedInSessionId = loggedIn.sessionId;
    console.log(loggedInSessionId);

    if (loggedInSessionId === usersessionId) {
      console.log("Session matched");
      console.log("Initial balance :" + balance);
      var remainingBalance;

      console.log(
        "Transaction initiated : " +
          ttype +
          " " +
          name +
          "(" +
          symbol +
          ") at " +
          atPrice +
          " " +
          otype +
          " " +
          mode
      );

      var newTrade = new Trade({
        orderType: otype.toUpperCase(),
        orderMode: mode.toUpperCase(),
        companyName: name,
        companyCode: symbol,
        transactionType: ttype.toUpperCase(),
        quantity: quantity,
        price: atPrice,
        tradedBy: userID,
      });

      // transaction.id = uuidv4();
      // console.log(transaction);
      transaction.id = ObjectId(newTrade._id).toString();
      transaction.userID = userID;
      io.emit("transaction queued", transaction);

      // fetch wallet balance from database
      let currentUserWallet = await Holding.findOne({
        heldBy: userID,
        companyCode: "WALLETCASH",
      });

      let currentUserWalletBalance = currentUserWallet.quantity;
      console.log(
        "Wallet balance fetched from DB : ",
        currentUserWalletBalance
      );

      let amt = parseFloat(quantity) * parseFloat(atPrice);
      let brokerage = parseFloat(0.002 * amt);
      brokerage = brokerage;
      console.log(brokerage);
      amt = parseFloat(amt + brokerage);

      balance = currentUserWalletBalance;

      // Check if transaction feasible or not
      if (ttype.toUpperCase() === "BUY") {
        remainingBalance = parseFloat(balance - amt).toFixed(2);
        console.log("Remains : ", remainingBalance);
      } else {
        remainingBalance = parseFloat(balance + amt).toFixed(2);
        console.log("Remains : ", remainingBalance);
      }

      if (remainingBalance < 0) {
        rejectTransaction("Insufficient wallet balance to perform transaction");
      } else {
        // newTrade.save().then((value) => {
        // console.log(ObjectId(value._id).toString());
        // console.log(value);
        // let amt = parseFloat(quantity) * parseFloat(atPrice);
        console.log("Transaction amount :", amt);
        if (ttype.toUpperCase() === "BUY") {
          remainingBalance = parseFloat(balance - amt).toFixed(2);
          console.log("Remains : ", remainingBalance);
        } else {
          remainingBalance = parseFloat(balance + amt).toFixed(2);
          console.log("Remains : ", remainingBalance);
        }
        // remainingBalance = Math.round(remainingBalance * 100) / 100.0;
        remainingBalance = remainingBalance;
        transaction.remainingBalance = remainingBalance;
        console.log("Remaining Balance : ", remainingBalance);

        Holding.findOne(
          { heldBy: userID, companyCode: symbol },
          async function (err, holdings) {
            if (err) {
              console.log("Error : ", err);
            }
            if (!holdings && ttype.toUpperCase() === "BUY") {
              var newHolding = new Holding({
                companyName: name,
                companyCode: symbol,
                quantity: quantity,
                heldBy: userID,
              });
              newHolding.save().then(async (newHolding) => {
                await newTrade.save();
                console.log("New Holding : ", newHolding);
                Holding.findOneAndUpdate(
                  { heldBy: userID, companyCode: "WALLETCASH" },
                  {
                    $inc: { quantity: -amt },
                  },
                  { new: true }
                ).exec((err, newWallet) => {
                  if (err) {
                    console.log(err);
                  }
                  console.log("Updated wallet to : ", newWallet);
                  // console.log(newWallet);
                });
              });
              sendTransactionReceipt(transaction);
            } else {
              if (ttype.toUpperCase() === "BUY") {
                await newTrade.save();
                Holding.findOneAndUpdate(
                  { heldBy: userID, companyCode: symbol },
                  { $inc: { quantity: quantity } },
                  { new: true }
                ).exec((err, newHolding) => {
                  console.log("Updated Holding : ", newHolding);
                  Holding.findOneAndUpdate(
                    { heldBy: userID, companyCode: "WALLETCASH" },
                    {
                      $inc: { quantity: -amt },
                    },
                    { new: true }
                  ).exec((err, newWallet) => {
                    if (err) {
                      console.log(err);
                    }
                    console.log("Updated wallet to : ", newWallet);
                    // console.log(newWallet);
                  });
                });
                sendTransactionReceipt(transaction);
              } else if (ttype.toUpperCase() === "SELL") {
                Holding.findOne({ heldBy: userID, companyCode: symbol }).exec(
                  async (err, existingHolding) => {
                    console.log("SELL existing : ", existingHolding);
                    if (!existingHolding) {
                      console.log("No existing holdings");
                      rejectTransaction("No existing holdings");
                    } else {
                      if (quantity > existingHolding.quantity) {
                        console.log(
                          "Existing holdings too less to perform transaction"
                        );
                        rejectTransaction(
                          "Existing holdings too less to perform transaction"
                        );
                      } else {
                        await newTrade.save();
                        Holding.findOneAndUpdate(
                          { heldBy: userID, companyCode: symbol },
                          { $inc: { quantity: -quantity } },
                          { new: true }
                        ).exec((err, newHolding) => {
                          console.log("Updated Holding : ", newHolding);
                          Holding.findOneAndUpdate(
                            { heldBy: userID, companyCode: "WALLETCASH" },
                            {
                              $inc: { quantity: amt },
                            },
                            { new: true }
                          ).exec((err, newWallet) => {
                            if (err) {
                              console.log(err);
                            }
                            console.log("Updated wallet to : ", newWallet);
                            // console.log(newWallet);
                          });
                        });
                        sendTransactionReceipt(transaction);
                      }
                    }
                  }
                );
              }
            }
          }
        );
        // });
      }
      function sendTransactionReceipt() {
        io.emit("transaction successful", transaction);
      }
      function rejectTransaction(msg) {
        console.log("rejecting....");
        transaction.message = msg;
        io.emit("transaction rejected", transaction);
      }
      // setTimeout(sendTransactionReceipt, 3000);
    } else {
      console.log("Session mismatch");
      io.emit("incorrect session", transaction);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

setInterval(async function () {
  var quotes = [];

  // Active when market is live
  const msg = await getPrices().then((result) => {
    result.forEach((quote) => {
      quotes.push({
        id: quote.symbol,
        // name: quote.longName,
        marketPrice: quote.regularMarketPrice,
        marketPriceChange: quote.regularMarketChange.toFixed(2),
        marketPriceChangePercent: quote.regularMarketChangePercent.toFixed(2),
        badgeClassName: quote.regularMarketChange > 0 ? "success" : "danger",
        arrowType: quote.regularMarketChange > 0 ? "up" : "down",
        symbol: quote.symbol,
        marketState: quote.marketState,
      });
    });
    io.emit("update prices", { quoteList: quotes });
  });

  // Active when market is closed
  // symbols.forEach((symbol) => {
  //   var regularMarketPrice = Math.floor(1000 + Math.random() * 9000);
  //   var regularMarketChange = Math.floor(1000 + Math.random() * 9000);
  //   var regularMarketChangePercent = Math.floor(1000 + Math.random() * 90);

  //   quotes.push({
  //     quoteSymbol: symbol,
  //     quotePrice: Math.floor(1000 + Math.random() * 9000),
  //     id: symbol,
  //     // name: quote.longName,
  //     marketPrice: regularMarketPrice,
  //     marketPriceChange: regularMarketChange.toFixed(2),
  //     marketPriceChangePercent: regularMarketChangePercent.toFixed(2),
  //     badgeClassName: regularMarketChange > 0 ? "success" : "danger",
  //     arrowType: regularMarketChange > 0 ? "up" : "down",
  //     symbol: symbol,
  //     marketState: "REGULAR",
  //   });
  // });
  // io.emit("update prices", { quoteList: quotes });
  // console.log(quotes);
}, 2000);
