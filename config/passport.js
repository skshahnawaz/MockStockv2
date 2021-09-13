const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/user");
var moment = require("moment");
const LoggedInUser = require("../models/loggedinuser.js");
const { v4: uuidv4 } = require("uuid");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      //match user
      User.findOne({ email: email })
        .then((user) => {
          if (!user) {
            return done(null, false, {
              message: "that email is not registered",
            });
          }
          //match pass
          bcrypt.compare(password, user.password, async (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
              if (user.eventsRegistered.includes("61264025c6c5770016243f98")) {
                // let sessionId = uuidv4();
                let loggedInStatus = await LoggedInUser.findOne({
                  userId: user._id,
                });
                // console.log("Login status : ", loggedInStatus);
                if (!loggedInStatus) {
                  console.log("No login status");
                  let a = moment
                    .utc("09:15:00", "hh:mm:ss")
                    .utcOffset("+05:30");
                  let b = moment
                    .utc("15:30:00", "hh:mm:ss")
                    .utcOffset("+05:30");
                  let c = moment.utc().utcOffset("+05:30");
                  console.log(a);
                  console.log(b);
                  console.log(c);
                  // user.sessionId = sessionId;
                  console.log(user);
                  if (moment(c).isBetween(a, b)) {
                    return done(null, user);
                  } else {
                    // return done(null, false, {
                    //   message: "Trading hours over",
                    // });
                    return done(null, user);
                  }
                } else {
                  if (loggedInStatus.loginStatus == 1) {
                    console.log("Already logged in user");
                    return done(null, false, {
                      message:
                        "Multiple login sessions detected. Please logout from previous session",
                    });
                  } else {
                    return done(null, user);
                  }
                }
              } else {
                return done(null, false, {
                  message: "Not Registered for MockStock",
                });
              }
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
