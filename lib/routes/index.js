var express = require('express');
var app = express();
var debugInstallFlarum = require('debug')('flarum:install')
var debug = require('debug')('flarum:app')
var path = require('path');
var debugError = require('debug')('flarum:error')
var fs = require('fs');
var P = require('bluebird');
var crypto = require('crypto');


if (process.env.NODE_ENV == 'development') {
	var flarumFolderDirectory = path.join(__dirname, '../../flarum'); // development
} else {
	var flarumFolderDirectory = path.join(__dirname, '../../../../flarum'); // production
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
var GetLatestId = models.latestId;

function routes (app, passport) {

	app.get('/*', function (req, res, next) {
		forumPath = app.path() != '//' && app.path() || '/';
		if (!config.installed && req.path !== '/flarum/install') {
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
			// userData: JSON.stringify(req.user),
			user: req.user
		})
	});

	app.get('/login', function (req, res) {
		if (req.user) res.redirect('/');

		res.render('index', {
			layout: 'layouts/layout',
			title: 'Login - Forum',
			forumPath: forumPath,
			showLoginModal: true,
			loginError: req.flash('loginError') || null
		})
	});

	app.get('/logout', function (req, res) {
		if (!req.user) return res.redirect(forumPath);
		req.logout();
		res.redirect(forumPath);
	})

	app.get('/d/:discussion', function (req, res, next) {
		var slug = req.params.discussion;
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
	});

	// ========== API ==========

	// GET - Get all discussions
	app.get('/api/discussions', function (req, res, next) {
		var tag = req.query.tag && req.query.tag || null;
		var tagRegExp = tag && new RegExp(tag, 'i') || new RegExp('().*', 'i');
		var search = req.query.q && req.query.q || null;
		var searchRegExp = search && new RegExp(search, 'i') || new RegExp('().*', 'i');

		P.resolve(ForumPosts.find({
			$or: [{
				tags: tagRegExp,
				title: searchRegExp
			}, {
				tags: tagRegExp,
				content: searchRegExp
			}, {
				title: searchRegExp
			}, {
				content: searchRegExp
			}],
			// tags: tagRegExp,
			// title: search,
			// content: search
		})
		.populate('start_user_id', 'username avatar')
		// .populate('start_user_id', 'avatar')
		.populate('last_user_id', 'username avatar')
		// .populate('last_user_id', 'avatar')
		.exec()).then(function (posts) {

			if (!posts || posts.length == 0) {
				res.status(200).json({ noPosts: true })
			} else {
				res.status(200).json({ posts: posts })

			}
		}).catch(function (err) {
			throwError('[ForumPosts] Error when: finding posts', err);
			return res.json({ error: err })
		})
		// res.json(functions.getFalseDiscussionList())
	});

	// POST - Create a new discussion
	app.post('/api/discussions', function (req, res, next) {
		if (!req.body) {
			debug('[Create Discussion] No data posted!');
			return res.status(403)
			.json({
				errors: [
				'No data found'
				]
			});
		}

		var errors = [];

		var title = req.body.title;
		var content = req.body.content;
		var tags = req.body.tags;

		var token = req.body.token;

		if (!title || title.length < 10) errors.push('Title is too short; min 10 char');
		if (!content || content.length < 30) errors.push('Post content is too short; min 30 char')
		if (!token || token.length < 30) errors.push('Invalid User Token');

		if (errors.length > 0) {
			return res.status(401).json({
				errors: errors
			});
		}


		ModelFind(User, {
			token: token
		}, function (err, user) {
			if (err) return res.status(500).send(err);


			if (!user || !user.length) {
				errors.push('No User Found With Token');
				return res.status(401).json({
					errors: errors
				})
			}

			user = user[0];

			GetLatestId(ForumPosts, function (err, newPostId) {
				if (err) return res.status(500).send(err);
				if (!newPostId) return res.status(500).json({
					errors: 'Something weird happened when trying to '
					+ ' get latest forum post id to save a new one'
				});

					var newForumPost = new ForumPosts();

					newForumPost.title = title;
					newForumPost.content = content;
					newForumPost.replyCount = 0;
					newForumPost.tags = tags || [];
					newForumPost.start_time = new Date();
					newForumPost.start_user_id = user._id;
					newForumPost.start_post_id = newPostId;
					newForumPost.last_time = new Date();
					newForumPost.last_user_id = user._id;
					newForumPost.last_post_id = newPostId;
					newForumPost.last_post_number = 1;
					newForumPost.is_approved = true;

					newForumPost.save(function (err) {
						if (err) return res.status(500).send(err);
						res.json({
							errors: [],
							success: true
						})
					});

				});

		})
	});

	// GET - Get a discussion by ID
	app.get('/api/discussions/:id', function (req, res, next) {
		if (!!req.params.length) return next();
		var index = req.params.id;

		debug(index);

		if (!index) return res.json({ error: 'Invalid structure of post url<br/>: ' + req.path });

		ForumPosts.find({
			start_post_id: index
		}, function (err, post) {
			if (err) {
				throwError('[MongoDB] /api/getDiscussion', err)
				return res.json({ error: err });
			}
			if (!post || post.length == 0)  return res.json({ postNotFound: true });

			post = post[0]

			res.json({ post: post });
		})
	});

	// PATCH - Update a discusion
	app.patch('/api/discussions/:id', function (req, res, next) {
		if (!req.body) {
			debug('[Update Discussion] No data posted!');
			return res.status(403)
			.json({
				errors: [
				'No data found'
				]
			});
		}
		if (!!req.params.length) return res.json({ error: 'Insufficient Parameters: ID typeof integer not found' });

		var errors = [];

		// Check if req.body has title or content, and user token;
		var title = req.body.title;
		var content = req.body.content;
		var token = req.body.token;

		if ((!title || title.length < 3) && (!content || content.length < 10)) {
			errors.push('Couldn\'t find either title or content to update for post with id of ' + req.params.title);
		}
		if (!token || token.length < 30) errors.push('Invalid User Token');
		if (!req.params.id) return res.json({ error: 'Invalid structure of post url<br/>: ' + req.path });

		if (errors.length > 0) {
			return res.status(401).json({
				errors: errors
			});
		}

		var index = req.params.id;

		User.findOne({
			token: token
		}, function (err, user) {
			if (err) errors.push('[MongoDB] Unable to perform search of user: ' + err);
			if (!err && !!user.length) errors.push('Invalid User Token; Could not find user with that token');

			if (errors.length > 0) {
				err ? res.status(500) : res.status(401);

				return res.json({
					errors: errors
				});
			}

			debug('[Update Post] Found User ' + user.username);

			ForumPosts.find({
				start_post_id: index
			}, function (err, post) {
				if (err) {
					throwError('[MongoDB] PATCH /api/discussions:id', err)
					return res.json({ error: err });
				}

				if (!post || post.length == 0)  return res.json({ errors: ['Unable to find post with id of ' + index] });
				if (post && post.start_user_id != user['_id'] && !user.admin) errors.push('You can\'t delete a discussion that\'s not yours!'); //

			post = post[0];

			debug('[Update Post] Found Post with title \"' + post.title + '\"');

			ForumPosts.findOneAndUpdate({
				start_post_id: index
			}, {
				title: title || post.title,
				content: content || post.content
			}, {
				new: true
			}, function (err, updatedPost) {
				if (err) {
					throwError('[MongoDB] PATCH /api/discussions:id', err)
					return res.json({ error: err });
				}

				if (!updatedPost || updatedPost.length == 0)  return res.json({ errors: ['Found post with id, but was unable to find it to update it'] });

				debug('[Update Post] Updated Post with title ' + post.title);
				debug('[Update Post] New Post: ', updatedPost);

				res.status(200).json({
					errors: [],
					success: true
				});
			});

		});

		});
	});

	app.delete('/api/discussions/:id', function (req, res, next) {
		if (!req.body) {
			return res.status(403)
			.json({
				errors: [
				'No data found'
				]
			});
		}
		if (!!req.params.length) return res.json({ error: 'Insufficient Parameters: ID typeof integer not found' });

		var token = req.body.token;
		var index = req.params.id;

		var errors = [ ];

		if (!token || token.length < 30) errors.push('Invalid User Token');
		if (!req.params.id) errors.push('Invalid structure of post url: ' + req.path);

		if (errors.length > 0) {
			return res.status(401).json({
				errors: errors
			});
		}

		User.findOne({
			token: token
		}, function (err, user) {
			if (err) errors.push('[MongoDB] Unable to perform search of user: ' + err);
			if (!err && !!user.length) errors.push('Invalid User Token; Could not find user with that token');

			if (errors.length > 0) {
				!err ? res.status(500) : res.status(401);

				return res.json({
					errors: errors
				});
			}

			debug('[Delete Post] Found User ' + user.username);

			ForumPosts.findOne({
				start_post_id: index
			}, function (err, post) {
				if (err) errors.push('[MongoDB] Unable to perform search of discussion: ' + err);
				if (!err && !post) errors.push('Could not find discussion with that id');

				if (post && post.start_user_id !== user['_id'] && !user.admin) errors.push('You can\'t delete a discussion that\'s not yours!');

				if (errors.length > 0) {
					!err ? res.status(500) : res.status(401);

					return res.json({
						errors: errors
					});
				}

				ForumPosts.findOneAndRemove({
					start_post_id: index
				}, function (err, postDeleted) {
					if (err) errors.push('[MongoDB] Unable to remove discussion: ' + err);

					if (errors.length > 0) {
						!err ? res.status(500) : res.status(401);

						return res.json({
							errors: errors
						});
					}

					res.status(200).json({
						errors: errors,
						success: true
					})
				})


			})
		})
	});

	app.post('/api/login/checkCredentials', function (req, res) {
		if (!req.body && !req.body.token) {
			debug('[CheckLogin] No data posted!');
			return res.status(403)
			.json({
				errors: [
				'No data found'
				]
			});
		}

		var userToken = req.body.token;
		var notLoggedIn;



		User.findOne({
			token: userToken
		}, function (err, user) {
			if (err) res.status(500).json({ error: err });
			if (!user || user.token != userToken) {
				return res.json({
					success: false
				});
			}
			res.json({
				success: true
			});
		});
	});


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
		if (req.body.password && req.body.passwordCheck && req.body.password !== req.body.passwordCheck) errors.push('Passwords do not match');

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

	app.get('/auth/local/callback', function (req, res, next) {

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
					res.redirect(forumPath + 'login');
					return false;
				}

				res.redirect(forumPath);
			})


		})(req, res, next);
	});

	app.get('/auth/github', passport.authenticate('github'));

	app.get('/auth/github/callback', function (req, res, next) {
		passport.authenticate('github', function (err, user) {
			req.logIn(user, function (err) {
				if (err) {
					req.flash('loginError', err);
					res.redirect(forumPath + 'login');
					return false;
				}

				res.redirect(forumPath);
			})
		})(req, res, next)
	});



	// FORUM INSTALL
	app.get('/flarum/install', function (req, res) {
		if (!config.installed) {
			res.render('install', { title: 'Install Flarum', layout: 'layouts/install', forumPath: forumPath });
		} else {
			res.redirect(forumPath);
		}
	});
	app.post('/flarum/install', function (req, res) {
		if (config.installed || db.host) return res.status(403).send('Forum already installed!');
		if (!req.body || !!req.body.length) return res.status(403).send('No data was sent!');
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
		newUser.createdIn = new Date();
		newUser.admin = true;
		newUser.token = crypto.randomBytes(40).toString('hex');
		newUser._id = 1;

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
							debugInstallFlarum('[ERROR] flarum/config.json new contents:');
							debugInstallFlarum(configFileContent);
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
			if (err.status != 404 && err.status != 401) {
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
		if (err.status != 404 && err.status != 401) {
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
