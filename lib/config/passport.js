var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var models = require('./models');
var User = models.user;

passport.use(new LocalStrategy(function (username, password, done) {
  User.findOne({ username: username }, function (err, user) {
    if (err) return done(err);
    if (!user) {
      User.findOne({ email: username }, function (err2, user2) {
        if (err2) return done(err2);
        if (!user2) {
          return done(null, false, { message: 'Incorrect username' });
        }
      });
    }
  })
}))
