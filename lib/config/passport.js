var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var P = require('bluebird');
var debug = require('debug')('flarum:login');

var models = require('./../models');
var User = models.user;
var ForumSettings = models.forum.settings;
var ModelFind = models.find;

var passportjs = require('./../config/passport')


module.exports = function (forumPath, passport) {

	passport.serializeUser(function(user, done) {
		debug('User: ' + user)
		console.log(user);
		done(null, user.google.id);
	});

	passport.deserializeUser(function(id, done) {
		debug('ID: ' + id);
		ModelFind(User, {
			'google.id' : id
		}, function (err, user) {
			done(err, user[0]);
		})
	});

	passport.use(new LocalStrategy(function (username, password, done) {

		ModelFind(User, {
			username: username
		}, function (err, doc) {
			if (err) return done(err);
			if (!user) {
				return done(null, false, req.flash('loginMessage', 'Invalid username'));
			}
			if (!user.validPassword(password)) {
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password'));
			}
			return done(null, user);
		});
	}));


	ModelFind(ForumSettings, {
		name: 'auth.google.credentials'
	}, function (err, credentials) {
		if (err) throw err;
		if (!credentials || credentials.length == 0) return false;

		debug('Google Credentials Exist!');
		debug(credentials[0]);

		credentials = credentials[0];

		passport.use(new GoogleStrategy({
			clientID: credentials.content.clientID,
			clientSecret: credentials.content.clientSecret,
			callbackURL: forumPath + 'auth/google/callback',
			// returnURL: forumPath + 'auth/google/callback',
			passReqToCallback: true
		}, function (req, token, refreshToken, profile, done) {

			process.nextTick(function () {

				ModelFind(User, {
					'google.id': profile.id
				}, function (err, user) {
					if (err) return done(err);

					if (user && user.length != 0) {
						return done(null, user[0])
					} else {

						var newUser = new User();

						newUser.name = profile.displayName;
						newUser.email = profile.emails[0].value;
						newUser.google.id = profile.id;
						newUser.google.token = token;

						newUser.save(function (err) {
							if (err) throw err;
							return done(null, newUser);
						})
					}
				})

			})

		}))

	})
}
