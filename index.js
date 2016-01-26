var express = require('express');
var hbs = require('hbs');
var path = require('path');
var debugError = require('debug')('flarum:error');
var fs = require('fs');
var config, routes;

var mongoose = require('mongoose');
var db = mongoose.connection;

var app = module.exports = express();


app.set('views', path.join(__dirname, 'lib/views'));
app.set('view engine', 'hbs');
app.set('port', process.env.PORT || 8080);

hbs.registerPartials(__dirname + '/lib/views/partials');
app.use(express.static(path.join(__dirname, '/lib/public')));


fs.readFile('flarum/config.json', 'utf8', function (err, data) {

	if (!err && !data) {
		fs.writeFile('flarum/config.json', '{}', function (err2) {
			if (err2) throw err2;
			console.log('[FLARUM] Config File Set Up!');

			config = require('./../../flarum/config.json')

			if (config.mongodb) connectMongo(config.mongodb);

			setUpRoutes();
			app.use('/', routes);
		});
	}
	if (err == 'Error: ENOENT, open \'flarum/config.json\'') {
		var error =  new Error('Config File Not Found');
		console.log('[FLARUM] ' + err);
		fs.mkdir('flarum', function (err1) {
			if (err1) throw err1;
			fs.writeFile('flarum/config.json', '{}', function (err2) {
				if (err2 == 'Error: ENOENT, open \'flarum/config.json\'') {
					var error =  new Error('Config File Not Found');
					return console.log('[FLARUM] ' + err);
				} else if (err2) throw err2;
				console.log('[FLARUM] Config File Written!');

				config = require('./../../flarum/config.json')

				if (config.mongodb) connectMongo(config.mongodb);

				setUpRoutes();
				app.use('/', routes);
			});
		});
	} else if (err) {
		var error =  new Error('[FLARUM] ' + err);
		throw error;
	} else if (data) {
		config = require('./../../flarum/config.json');

		setUpRoutes()
		app.use('/', routes);

		if (config.mongodb) connectMongo(config.mongodb);
	}
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});
})



// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		if (err.status != 404) {
			debugError('[ERROR]')
			debug(err)
		}
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err,
			notFound: err.status == 404,
			serverError: err.status == 500
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		notFound: err.status == 404,
		serverError: err.status == 500,
		error: { status: err.status }
	});
});


db.on('error', function (err) {
	if (err == 'MongoError: connect ECONNREFUSED') {
		debugError('[MongoDB] Could not connect to MongoDB!!');
	} else {
		debugError('[MongoDB] ' + err);
	}
});


function connectMongo (mongo) {
	if (mongo) {
		if (mongo.host && mongo.database && !mongo.username && !mongo.password) {
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
}

function setUpRoutes () {
	routes = require('./lib/routes');
	routes.set('views', path.join(__dirname, 'lib/views'));
	routes.set('view engine', 'hbs');
	app.use('/', routes);
}
