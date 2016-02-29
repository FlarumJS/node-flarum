var express = require('express');
var app = express();
var debugInstallFlarum = require('debug')('flarum:install')
var debug = require('debug')('flarum:app')
var path = require('path');
var debugError = require('debug')('flarum:error')
var fs = require('fs');


if (process.env.NODE_ENV == 'development') {
	var flarumFolderDirectory = path.join(__dirname + '../../../flarum'); // development
} else {
	var flarumFolderDirectory = path.join(__dirname + '../../../../../flarum'); // production
}


var config = require(flarumFolderDirectory + '/config.json');

var forumPath, passport;

var mongoose = require('mongoose');

var db = mongoose.connection;

var functions = require('../config/functions.js');
var connectMongo = functions.connectMongo;
var throwError = functions.throwError;

var models = require('../models/index.js');
var User = models.user;
var ForumSettings = models.forum.settings;
var ForumTags = models.forum.tags;
var ForumPosts = models.forum.posts;
var ModelFind = models.find;

function routes (app, passport) {

	app.get('/*', function (req, res, next) {
		forumPath = app.path() != '//' && app.path() || '/';
		if (!config.installed && req.path != '/flarum/install') {
			return res.redirect(forumPath + 'flarum/install')
		}
		if (!db.host && config.mongodb && config.mongodb.host && config.mongodb.database) {
			return res.send('Please restart the node process to continue and enjoy Flarum =D');
		}
		if (!db && req.path != '/flarum/install') {
			return res.redirect(forumPath + 'flarum/install')
		}
		next();
	})

	app.get('/', function (req, res, next) {
		var user = req.user;
		res.render('index', {
			title: 'Forum',
			layout: 'layouts/layout',
			forumPath: forumPath,
			user: JSON.stringify(req.user)
		})
	});

	app.get('/login', function (req, res, next) {
		if (req.user) res.redirect('/');

		res.render('index', {
			layout: 'layouts/layout',
			title: 'Login - Forum',
			forumPath: forumPath,
			showLoginModal: true,
			loginError: req.flash('loginError') || null
		})
	})

	app.get('/d/:discussion', function (req, res, next) {
		var slug = req.params.discussion;
		var slugRegExp = new RegExp(slug, 'i');
		var index = parseInt(slug.split('-')[0])

		if (!index) return next();

		res.render('postView', {
			title: 'Post - Forum',
			layout: 'layouts/layout',
			index: index,
			slug: slug,
			forumPath: forumPath,
			user: req.user
		})
	})

	// API
	app.post('/api/discussionList', function (req, res, next) {
		var tag = req.body && req.body.tag || null;
		var tagRegExp = new RegExp(tag, 'i');
		// debug(tagRegExp)

		// ForumPosts.find({ deleted: false, tags: tagRegExp }, function (err, post) {
		// 	if (err) {
		// 		throwError('[ForumPosts] Error when: finding posts', err);
		// 		return res.json({ error: 'hello i am stupid' })
		// 	}
		// 	if (!post || post.length == 0) {
		// 		throwError('[ForumPosts] No Posts!')
		// 		res.json({ noPosts: true })
		// 	} else {
		// 		throwError('[ForumPosts] Yes Posts!')
		// 		res.json({ posts: post })
		// 	}
		// })
		res.json(functions.getFalseDiscussionList())
	})

	app.post('/api/getDiscussion', function (req, res, next) {
		var slug = req.body && req.body.slug  || null
		var slugRegExp = new RegExp(slug, 'i');
		var index = req.body && ( req.body.index || parseInt(slug.split('-')[0]) ) || null;

		if (!index) return res.json({ error: 'Invalid structure of post url <br> Slug: ' + slug });

		ForumPosts.find({
			index: index,
			slug: slugRegExp
		}, function (err, post) {
			if (err) {
				throwError('[MongoDB] /api/getDiscussion', err)
				return res.json({ error: err });
			}
			if (!post || post.length == 0)  return res.json({ postNotFound: true });

			post = post[0]

			res.json({ post: post });
		})
	})



	// LOGIN

	app.post('/api/signup', function (req, res, next) {

		if (!req.body) {
			return res.status(401).json({
				errors: [ 'No data posted!' ]
			});
		}

		var errors = [];
		if (!req.body.username) errors.push('Introduce your username');
		if (!req.body.email) errors.push('Introduce your email');
		if (!req.body.password) errors.push('Introduce your password');
		if (!req.body.passwordCheck) errors.push('Reenter your password');
		if (req.body.password && req.body.passwordCheck && req.body.password != req.body.passwordCheck) errors.push('Passwords do not match');

		if (errors.length > 0) {
			return res.status(401).json({
				errors: errors
			});
		};

		passport.authenticate('local-signup', function (err, user) {

			if (err) errors.push(err);
			if (!err && !user) errors.push('An unknown error has occurred. Please refresh the page');

			if (errors.length > 0) {
				return res.status(401).json({
					errors: errors
				});
			}


			res.json({
				errors: [],
				success: true
			});

		})(req, res, next);

	});

	app.post('/api/login', function (req, res, next) {

		if (!req.body) {
			return res.status(401).json({
				errors: [ 'No data posted!' ]
			});
		}

		var errors = [];

		if (!req.body.username) errors.push('Introduce your username');
		if (!req.body.password) errors.push('Introduce your password');

		if (errors.length > 0) {
			return res.status(401).json({
				errors: errors
			});
		};

		passport.authenticate('local-login', function (err, user) {

			if (err) errors.push(err);

			if (!err && !user) errors.push('An unknown error has occurred. Please refresh the page');

			if (errors.length > 0) {
				return res.status(401).json({
					errors: errors
				});
			}

			res.json({
				errors: [],
				success: true
			});
		})(req, res, next);
	});

	app.get('/api/login', function (req, res, next) {

		if (!req.query) {
			req.flash('loginError', ['Please enter your username & password']);
			return res.redirect(forumPath + 'login');
		}

		var errors = [];

		if (!req.query.username) errors.push('Introduce your username');
		if (!req.query.password) errors.push('Introduce your password');

		if (errors.length > 0) {
			req.flash('loginError', errors);
			return res.redirect(forumPath + 'login');
		}

		passport.authenticate('local-login', function (err, user) {

			if (err) errors.push(err);

			if (!err && !user) errors.push('An unknown error has occurred. Please refresh the page');

			if (errors.length > 0) {
				req.flash('loginError', errors);
				return res.redirect(forumPath + 'login');
			}

			req.login(user, function (err) {
				if (err) {
					errors.push(err);
					req.flash('loginError', errors);
					return res.redirect(forumPath + 'login');
				}

				res.redirect(forumPath);
			})


		})(req, res, next);
	});

	// app.get('/auth/google/callback', passport.authenticate('google', {
	// 	successRedirect: forumPath,
	// 	failureRedirect: '/login?loginError=true'
	// }));



	// FORUM INSTALL
	app.get('/flarum/install', function (req, res, next) {
		if (!config.installed) {
			res.render('install', { title: 'Install Flarum', layout: 'layouts/install', forumPath: forumPath });
		} else {
			res.redirect(forumPath);
		}
	});
	app.post('/flarum/install', function (req, res, next) {
		if (config.installed || db.host) return res.status(403).send('Forum already installed!');
		if (!req.body) return res.status(403).send('No data was sent!');
		var forumTitle = req.body.forumTitle;
		var admin = {
			username: req.body.adminUsername,
			email: req.body.adminEmail,
			password: req.body.adminPassword,
			passwordConfirmation : req.body.adminPasswordConfirmation
		}
		var mongodb = {
			host: req.body.mongoHost,
			database: req.body.mongoDatabase,
			username: req.body.mongoUsername,
			password: req.body.mongoPassword
		}
		// console.log(path.join(__dirname + '/../../../../flarum/config.json'));

		if (!forumTitle) return res.status(500).send('Forum Title can\'t be empty');

		if (!mongodb.host) return res.status(500).send('MongoDB Host can\'t be empty');
		if (!mongodb.database) return res.status(500).send('MongoDB Database can\'t be empty');
		if (mongodb.username && !mongodb.password) return res.status(500).send('You forgot to type the MongoDB Password!');
		if (!mongodb.username && mongodb.password) return res.status(500).send('You forgot to type the MongoDB Username!');

		if (!admin.username) return res.status(500).send('Admin Username can\'t be empty');
		if (admin.username.length < 4) return res.status(500).send('Username is too short (min 4 char)');
		if (!admin.email) return res.status(500).send('Admin Email can\'t be empty');
		if (!admin.password) return res.status(500).send('Admin Password can\'t be empty');
		if (admin.password.length < 6) return res.status(500).send('Password is too short (min 6 char)');
		if (!admin.passwordConfirmation) return res.status(500).send('Confirm Password can\'t be empty');
		if (admin.password != admin.passwordConfirmation) return res.status(500).send('Passwords do not match');

		debugInstallFlarum('Passed Validation Checks!');

		connectMongo(mongodb)

		var newUser = new User();
		newUser.username = admin.username;
		newUser.email = admin.email;
		newUser.password = newUser.generateHash(admin.password);
		newUser.createdIn = new Date().toLocaleDateString();
		newUser.admin = true;

		newUser.save(function (err) {
			if (err) {
				debugInstallFlarum('[ERROR] newUser.save() err =>')
				debugInstallFlarum('[ERROR] ' + err);
				return res.status(500).send(err);
			}
			debugInstallFlarum('Saved Admin User => Database!')

			var titleSettings = new ForumSettings();
			var bannerSettings = new ForumSettings();
			titleSettings.name = 'forum.title';
			titleSettings.description = 'Name of the Forum'
			titleSettings.content = forumTitle;

			bannerSettings.name = 'forum.welcomeBanner';
			bannerSettings.description = 'Welcome Banner content';
			bannerSettings.content = 'Welcome to ' +forumTitle+ '!';


			titleSettings.save(function (err2) {
				if (err2) {
					debugInstallFlarum('[ERROR] titleSettings.save() err =>')
					debugInstallFlarum('[ERROR] ' + err2);
					return res.status(500).send(err2);
				}
				debugInstallFlarum('Saved Title Settings => Database!')

				bannerSettings.save(function (err3) {
					if (err3) {
						debugInstallFlarum('[ERROR] bannerSettings.save() err =>')
						debugInstallFlarum('[ERROR] ' + err3);
						return res.status(500).send(err3);
					}
					debugInstallFlarum('Saved Banner Settings => Database!')

					config.mongodb = mongodb;

					var configFileContent = config;


					configFileContent.installed = true;

					var configFileContent = JSON.stringify(config, null, 2);


					fs.writeFile('flarum/config.json', configFileContent, function (err) {
						if (err) {
							debugInstallFlarum('[ERROR] fs.writeFile() err =>')
							debugInstallFlarum('[ERROR] ' + err);
							return res.status(500).send('File System: ' + err);
						}
						debugInstallFlarum('Wrote File!')
						debugInstallFlarum('Install Successfully Complete!')


						res.send('Success!!!')
					});
				});
			});
		});
	});



	// ========== ERROR ==========

	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handlers

	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
		app.use(function(err, req, res, next) {
			err.status = err.status || 500;
			if (err.status != 404) {
				debugError('[ERROR]')
				debugError(err)
			}
			res.status(err.status);
			res.render('error', {
				message: err.message,
				error: err,
				notFound: err.status == 404,
				serverError: err.status == 500,
				unauthorized: err.status == 403,
				forumPath: forumPath
			});
		});
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		if (!err.status) err.status = 500;
		if (err.status != 404) {
			debugError('[ERROR]')
			debugError(err)
		}

		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			notFound: err.status == 404,
			serverError: err.status == 500,
			unauthorized: err.status == 403,
			error: { status: err.status },
			forumPath: forumPath
		});
	});

}



module.exports = routes;
