var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var P = require('bluebird');
var debug = require('debug')('flarum:login');

var models = require('./../models');
var User = models.user;
var ForumSettings = models.forum.settings;
var ModelFind = models.find;

var passportjs = require('./../config/passport');
var functions = require('./../config/functions');

var throwError = functions.throwError;


module.exports = function (forumPath, passport) {

	passport.serializeUser(function(user, done) {
		console.log(JSON.stringify(user, null, 4));
		done(null, user.username);
	});

	passport.deserializeUser(function(username, done) {
		ModelFind(User, {
			'username' : username
		}, function (err, user) {
			done(err, user[0]);
		})
	});

	// passport.use(new LocalStrategy(function (username, password, done) {

	// 	ModelFind(User, {
	// 		username: username
	// 	}, function (err, doc) {
	// 		if (err) return done(err);
	// 		if (!user) {
	// 			return done(null, false, req.flash('loginMessage', 'Invalid username'));
	// 		}
	// 		if (!user.validPassword(password)) {
	// 			return done(null, false, req.flash('loginMessage', 'Oops! Wrong password'));
	// 		}
	// 		return done(null, user);
	// 	});
	// }));

	passport.use('local-signup', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	}, function (req, username, password, done) {

		process.nextTick(function () {

			ModelFind(User, {
				'username': username
			}, function (err, user) {

				if (err) {
					throwError('[PASSPORT] SIGNUP: Error in ModelFind', err);
					done(err);
				}

				if (user && user.length != 0) {
					return done('Username already exists', false);
				} else {

					ModelFind(User, {
						'email': req.body.email
					}, function (err, user) {

						if (err) {
							throwError('[PASSPORT] SIGNUP: Error in 2nd ModelFind', err);
							done(err);
						}

						if (user && user.length != 0) {
							return done('Email already exists', false);
						} else {

							var newUser = new User();

							newUser.username = username;
							newUser.email = req.body.email;
							newUser.createdIn = new Date()
							newUser.password = newUser.generateHash(password);

							newUser.save(function (err) {
								if (err) {
									throwError('[PASSPORT] SIGNUP: Error @ saving new user', err);
									done(err);
								}
								return done(null, newUser);
							})

						}

					})

				}
			})

		})
	}));

	passport.use('local-login', new LocalStrategy({
		passReqToCallback: true
	}, function (req, username, password, done) {

		User.findOne({
			'username': username
		}, function (err, user) {

			if (err) return done(err);

			if (!user || user.length == 0) return done('No user found', false);

			if (!user.validPassword(password)) return done('Oops! Wrong password.', false);

			return done(null, user);

		})

	}));
}
