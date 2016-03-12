var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GithubStrategy = require('passport-github').Strategy;

var P = require('bluebird');
var debug = require('debug')('flarum:login');
var crypto = require('crypto');

var models = require('./../models');
var User = models.user;
var ForumSettings = models.forum.settings;
var ModelFind = models.find;
var GetLatestId = models.latestId;

var passportjs = require('./../config/passport');
var functions = require('./../config/functions');

var throwError = functions.throwError;


/**
	* Function to set up passport strategies
	*
	* @param {String}   forumPath -  the forum's path
	* @param {Passport} passport  -  the passport.js object
	**/
	module.exports = function (forumPath, passport) {

		passport.serializeUser(function(user, done) {
			done(null, user.username);
		});

		passport.deserializeUser(function(username, done) {
			ModelFind(User, {
				'username' : username
			}, function (err, user) {
				done(err, user[0]);
			})
		});

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
								newUser.token = crypto.randomBytes(40).toString('hex');

								GetLatestId(User, function (err, id) {
									if (err) done(err, null);

									console.log(id);
									newUser._id = id;

									newUser.save(function (err) {
										if (err) {
											debug(err);
											throwError('[PASSPORT] SIGNUP: Error @ saving new user', err);
											done(err);
										}
										return done(null, newUser);
									})
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

			// console.log(password);

			User.findOne({
				'username': username
			}, function (err, user) {

				if (err) return done(err);

				// console.log(user);

				if (!user || user.length == 0) return done('No user found', false);

				if (!user.validPassword(password)) return done('Oops! Wrong password.', false);

				User.findOneAndUpdate({
					'username': username
				}, {
					'lastLoggedIn': new Date()
				}, {
					new: true
				}, (err, user) => done(err, user))

			})
		}));


		ModelFind(ForumSettings, {
			name: 'auth.github.credentials'
		}, function (err, credentials) {
			if (err) return throwError('[PASSPORT] Get Credentials for GitHub', err);
			if (!credentials || !credentials.length) {
				debug('[GitHub] No credentials found!');
				return false;
			}

			debug('[GitHub] Credentials Found!');


			passport.use('github', new GithubStrategy({
				clientID: credentials[0].content.clientID,
				clientSecret: credentials[0].content.clientSecret,
				callbackUrl: forumPath + 'auth/github/callback'
			}, function (accessToken, refreshToken, profile, done) {

				ModelFind(User, {
					'github.id': profile.id
				}, function (err, user) {
					if (err) return done(err, user);

					if (user && user.length > 0) {
						User.findOneAndUpdate({
							'github.id' : profile.id
						}, {
							'github.id' : profile.id,
							username: profile.username,
							avatar: profile.photos[0] && profile.photos[0].value || null,
							lastLoggedIn: new Date()
						}, {
							upsert: true,
							new: true
						}, (err, user) => done(err, user));
					} else {

						var newGithubUser = new User();
						newGithubUser.github = {};
						newGithubUser.github.id = profile.id;
						newGithubUser.username = profile.username;
						newGithubUser.avatar = profile.photos[0] && profile.photos[0].value || null;
						newGithubUser.lastLoggedIn = new Date();
						newGithubUser.createdIn = new Date();
						newGithubUser.token = crypto.randomBytes(40).toString('hex');

						GetLatestId(User, function (err, id) {
							if (err) return done(err, null);
							if (!id) return done('Something weird happened while trying to get a user ID for you', null);

							newGithubUser._id = id;

							newGithubUser.save(function (err, user) {
								throwError('[GitHub Sign In] ' + err);
								done(err, newGithubUser);
							});
						})

					}

				})
			}))
		})

	}
