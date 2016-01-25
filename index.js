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

app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});


fs.exists(__dirname + '/lib/config/config.json', function (exists) {
	if (!exists) {
		console.log('File does not exist!')
		fs.writeFile(__dirname + '/lib/config/config.json', '{}', function (err2) {
			if (err2) throw err;
			console.log('[FLARUM] Config File Written!');

			config = require('./lib/config/config.json')

			connectMongo(config.mongodb);

			routes = require('./lib/routes/index');
			app.use('/', routes);
		});
	} else if (exists) {
		config = require('./lib/config/config.json');
		routes = require('./lib/routes/index');
		app.use('/', routes);
		console.log('Path: ' + routes.path());
		connectMongo(config.mongodb);
	}

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
