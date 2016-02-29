var express = require('express');
var session = require('express-session');
var hbs = require('hbs');
var path = require('path');
var debugError = require('debug')('flarum:error');
var fs = require('fs');
var config, routes;

var passport = require('passport');
var flash    = require('connect-flash');
var passportjs = require('./lib/config/passport');

var functions = require('./lib/config/functions');

if (process.env.NODE_ENV == 'development') {
	var flarumFolderDirectory = path.join(__dirname + '/flarum'); // development
} else {
	var flarumFolderDirectory = path.join(__dirname + '/../../flarum'); // production
}

var connectMongo = functions.connectMongo;
var throwError = functions.throwError;

var mongoose = require('mongoose');
var db = mongoose.connection;

var app = module.exports = express();


app.set('views', path.join(__dirname, 'lib/views'));
app.set('view engine', 'hbs');
app.set('port', process.env.PORT || 8080);

hbs.registerPartials(__dirname + '/lib/views/partials');


app.use(session({ secret: 'nyan keyboard' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, '/lib/public')));

passportjs((app.path() != '//' && app.path() || '/'), passport);


fs.readFile(flarumFolderDirectory + '/config.json', 'utf8', function (err, data) {

	if (!err && !data) {
		fs.writeFile(confirFileDirname, '{}', function (err2) {
			if (err2) return throwError('Error while trying to create config.json file', err2);
			console.log('[FLARUM] Config File Set Up!');

			config = require(flarumFolderDirectory + '/config.json');

			if (config.mongodb) connectMongo(config.mongodb);

			setUpRoutes();
			app.use('/', routes);
		});
	}
	if (err == 'Error: ENOENT, open \'flarum/config.json\'') {
		var error =  new Error('Config File Not Found');
		console.log('[FLARUM] ' + err);
		fs.mkdir(flarumFolderDirectory, function (err1) {
			if (err1) return throwError('Error while trying to create flarum/ directory', err1);
			fs.writeFile('flarum/config.json', '{}', function (err2) {
				if (err2 == 'Error: ENOENT, open \'flarum/config.json\'') {
					var error =  new Error('Config File Not Found');
					return console.log('[FLARUM] ' + err);
				} else if (err2) throw err2;
				console.log('[FLARUM] Config File Written!');

				config = require(flarumFolderDirectory + '/config.json');

				if (config.mongodb) connectMongo(config.mongodb);

				setUpRoutes();
				app.use('/', routes);
			});
		});
	} else if (err) {
		debugError('Error while trying to open the config.json file in flarum/', err);
	} else if (data) {

		config = require(flarumFolderDirectory + '/config.json');

		setUpRoutes()
		app.use('/', routes);

		if (config.mongodb) connectMongo(config.mongodb);
	}
})




db.on('error', function (err) {
	if (err == 'MongoError: connect ECONNREFUSED') {
		throwError('[MongoDB] Could not connect to MongoDB!!');
	} else {
		throwError('[MongoDB] ', err);
	}
});

function setUpRoutes () {
	routes = require('./lib/routes');
	// routes.setDependencies(passport);
	// routes.app.set('views', path.join(__dirname, 'lib/views'));
	// routes.app.set('view engine', 'hbs');
	routes(app, passport);
}
