var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var P = require('bluebird');

var models = require('./../models');
var User = models.user;


module.exports = function (passport) {
  
  passport.use(new LocalStrategy(function (username, password, done) {
    P.resolve(model.Users.aggregate().match({
      username: username
    }).exec()).then(function (user) {
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
      
    }).catch( function (err) {
      return done(err);
    })
    
  }))
  ;
}
