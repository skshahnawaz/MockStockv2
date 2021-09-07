const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/user");
var moment = require("moment");

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
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
              if (user.eventsRegistered.includes("61264025c6c5770016243f98")) {
                let a = moment("09:15:00", "hh:mm:ss");
                let b = moment("15:30:00", "hh:mm:ss");
                let c = moment();
                console.log(a);
                console.log(b);
                console.log(c);
                if (moment(c).isBetween(a, b)) {
                  return done(null, user);
                } else {
                  return done(null, false, {
                    message: "Trading hours over",
                  });
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
