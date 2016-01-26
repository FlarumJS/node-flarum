var express = require('express');
var app = express();
var debugInstallFlarum = require('debug')('flarum:install')
var debug = require('debug')('flarum:app')
var path = require('path');
var debugError = require('debug')('flarum:error')
var fs = require('fs');

var config = require(path.join(__dirname + '../../../../../flarum/config.json'));

var models = require('../models/index.js');
var User = models.user;
var ForumSettings = models.forum.settings;
var ForumTags = models.forum.tags;
var ForumPosts = models.forum.posts;
var db = require('mongoose').connection;

app.get('/*', function (req, res, next) {
	if (!config.installed && req.path != '/flarum/install') {
		return res.redirect('/flarum/install')
	}
	if (!db.host && config.mongodb && config.mongodb.host && config.mongodb.database) {
		return res.send('Please restart the node process to continue and enjoy Flarum =D');
	}
	if (!db && req.path != '/flarum/install') {
		return res.redirect('/flarum/install')
	}
	next();
})

app.get('/', function (req, res, next) {
	res.render('index', { title: 'Forum', layout: 'layouts/layout'})
});

app.get('/d/:discussion', function (req, res, next) {
	var slug = req.params.discussion;
	var slugRegExp = new RegExp(slug, 'i');
	var index = parseInt(slug.split('-')[0])

	if (!index) return next();

	res.render('postView', {
		title: 'Post - Forum',
		layout: 'layouts/layout',
		index: index,
		slug: slug
	})
})

// API
app.post('/api/discussionList', function (req, res, next) {
	var tag = req.body.tag;
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
	res.json(getFalseDiscussionList())
})

app.post('/api/getDiscussion', function (req, res, next) {
	var slug = req.body.slug;
	var slugRegExp = new RegExp(slug, 'i');
	var index = req.body.index || parseInt(slug.split('-')[0])

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


// FORUM INSTALL
app.get('/flarum/install', function (req, res, next) {
	if (!config.installed) {
		res.render('install', { title: 'Install Flarum', layout: 'layouts/install' });
	} else {
		res.redirect('/');
	}
});
app.post('/flarum/install', function (req, res, next) {
	if (config.installed || db) return res.status(403).send('Forum already installed!');
	var forumTitle = req.body.forumTitle;
	var admin = {
		username: req.body.adminUsername,
		email: req.body.adminEmail,
		password: req.body.adminPassword,
		passwordConfirmation : req.body.adminPasswordConfirmation
	}
	var mongodb = {
		host: req.body.host,
		database: req.body.database,
		username: req.body.username,
		password: req.body.password
	}

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

	debugInstallFlarum('Passed Validation Checks!')

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

		var newForumSettings = new ForumSettings();
		newForumSettings.title = forumTitle;
		newForumSettings.welcomeBanner.title = 'Welcome to ' +forumTitle+ '!';

		connectMongo(mongodb)

		newForumSettings.save(function (err2) {
			if (err2) {
				debugInstallFlarum('[ERROR] newForumSettings.save() err =>')
				debugInstallFlarum('[ERROR] ' + err);
				return res.status(500).send(err);
			}
			debugInstallFlarum('Saved Forum Settings => Database!')

			config.installed = true;
			config.mongodb = mongodb;

			var configFileContent = JSON.stringify(config, null, 2);

			fs.writeFile(__dirname + '/../config/config.json', configFileContent, function (err) {
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


function throwError (message, err) {
	debugError(message);
	if (err) debugError(err);
}

function getFalseDiscussionList () {
	var falseDiscussionList = {
		posts: [
		{
			title: 'lol',
			slug: '1-test-discussion',
			start_username: 'datitisev',
			last_username: 'hola',
			replyCount: 9,
			tags: [
			{
				color: 'red',
				label: 'Hi'
			}, {
				color: 'yellow',
				label: 'Bye'
			}
			]
		},
		{
			title: 'hahaha',
			slug: '2-test-discussion',
			start_username: 'hola',
			last_username: 'datitisev',
			replyCount: 24,
			tags: [
			{
				color: 'blue',
				label: 'Blue'
			}, {
				color: 'lightgray',
				label: 'General'
			}
			]
		}
		]
	}
	return falseDiscussionList;
}

function connectMongo (mongo) {
	if (mongo.host && mongo.database &&
		!mongo.username && !mongo.password) {
		var mongoUrl = 'mongodb://' + mongo.host + '/' + mongo.database;
	mongoose.connect(mongoUrl);
	} else if (mongo.host && mongo.database &&
		mongo.username && mongo.password) {
		var mongoUrl = 'mongodb://' + mongo.username + ':';
		mongoUrl += mongo.password + '@';
		mongoUrl += mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);
	} else {
		// No Mongo Config
	}
}

module.exports = app;

