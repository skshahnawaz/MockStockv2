const yahooFinance = require("yahoo-finance2").default;
var express = require("express");
const { v4: uuidv4 } = require("uuid");
var moment = require("moment");
var app = express();

async function getPrice(stocks) {
  const result = await yahooFinance.quote(stocks);
  //   console.log(result);
  return result;
}

// set the view engine to ejs
app.set("view engine", "ejs");

// use res.render to load up an ejs view file

// index page
app.get("/", async function (req, res) {
  var quotes = [];
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
  ];

  const msg = await getPrice(symbols).then((result) => {
    result.forEach((quote) => {
      quotes.push({
        id: uuidv4(),
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
    res.render("pages/index2", {
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

const port = 3001 || process.env.PORT;
app.listen(port);
console.log(`Server is listening on port ${port}`);
