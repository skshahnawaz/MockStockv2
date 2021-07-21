const yahooFinance = require("yahoo-finance2").default;
var express = require("express");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");
var app = express();
const socket = require("socket.io");
// var Chart = require("chart.js");

const symbols = [
  "TCS.NS",
  "RELIANCE.NS",
  "WIPRO.NS",
  "LTTS.NS",
  "TECHM.NS",
  "MINDTREE.NS",
  "BAJFINANCE.NS",
  "TATASTEEL.NS",
  "ADANITRANS.NS",
  "ADANIPOWER.NS",
];

async function getPrices() {
  const result = await yahooFinance.quote(symbols);
  //   console.log(result);
  return result;
}

// set the view engine to ejs
app.set("view engine", "ejs");

// use res.render to load up an ejs view file

// index page
app.get("/", async function (req, res) {
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
    res.render("pages/index4", {
      quotes: quotes,
      marketState: quotes[0].marketState,
    });
  });

  //   var marketState = quote.marketState;
});

// about page
// app.get("/about", function (req, res) {
//   res.render("pages/about");
// });

// const port = process.env.PORT;
const port = 3001;
// app.listen(port);
// console.log(`Server is listening on port ${port}`);

const server = app.listen(port, () => {
  console.log(`listening on *:${port}`);
});

const io = socket(server);

io.on("connection", async function (socket) {
  console.log("user connected : ", socket.id);

  socket.on("transact", (transaction) => {
    const { ttype, symbol, name, quantity, lotSize, mode, atPrice, otype } =
      transaction;
    console.log(
      "Transaction initiated : " +
        ttype +
        " " +
        name +
        "(" +
        symbol +
        ") at " +
        atPrice
    );

    transaction.id = uuidv4();

    io.emit("transaction queued", transaction);

    function sendTransactionReceipt() {
      io.emit("transaction successful", transaction);
    }
    setTimeout(sendTransactionReceipt, 3000);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

setInterval(async function () {
  var quotes = [];

  // Active when market is live

  // const msg = await getPrices().then((result) => {
  //   result.forEach((quote) => {
  //     quotes.push({
  //       id: quote.symbol,
  //       // name: quote.longName,
  //       marketPrice: quote.regularMarketPrice,
  //       marketPriceChange: quote.regularMarketChange.toFixed(2),
  //       marketPriceChangePercent: quote.regularMarketChangePercent.toFixed(2),
  //       badgeClassName: quote.regularMarketChange > 0 ? "success" : "danger",
  //       arrowType: quote.regularMarketChange > 0 ? "up" : "down",
  //       symbol: quote.symbol,
  //       marketState: quote.marketState,
  //     });
  //   });
  //   io.emit("update prices", { quoteList: quotes });
  // });

  // Active when market is closed
  symbols.forEach((symbol) => {
    var regularMarketPrice = Math.floor(1000 + Math.random() * 9000);
    var regularMarketChange = Math.floor(1000 + Math.random() * 9000);
    var regularMarketChangePercent = Math.floor(1000 + Math.random() * 90);

    quotes.push({
      quoteSymbol: symbol,
      quotePrice: Math.floor(1000 + Math.random() * 9000),
      id: symbol,
      // name: quote.longName,
      marketPrice: regularMarketPrice,
      marketPriceChange: regularMarketChange.toFixed(2),
      marketPriceChangePercent: regularMarketChangePercent.toFixed(2),
      badgeClassName: regularMarketChange > 0 ? "success" : "danger",
      arrowType: regularMarketChange > 0 ? "up" : "down",
      symbol: symbol,
      marketState: "REGULAR",
    });
  });
  io.emit("update prices", { quoteList: quotes });
  // console.log(quotes);
}, 1000);
