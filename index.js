var express = require('express');
var hbs = require('hbs');
var path = require('path');
var debugError = require('debug')('flarum:error');
var fs = require('fs');
var config, routes;

var mongoose = require('mongoose');
var db = mongoose.connection;

var app = module.exports = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('port', process.env.PORT || 8080);

hbs.registerPartials(__dirname + '/lib/views/partials');
app.use(express.static(path.join(__dirname, '/lib/public')));

app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

fs.exists(path.join(__dirname + 'lib/config/config.json'), function (exists) {
	if (!exists) {
		console.log('File does not exist!')
		fs.writeFile(__dirname + '/lib/config/config.json', '{}', function (err2) {
			if (err2) throw err;
			console.log('[FLARUM] Config File Written!');

			config = require('./lib/config/config.json');
			routes = require('./lib/routes/index');
			app.use('/', routes);
		});
	} else if (exists) {
		config = require('./lib/config/config.json');
		routes = require('./lib/routes/index');
		app.use('/', routes);
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

if (config) {
	if (config.mongodb.host && config.mongodb.database &&
		!config.mongodb.username && !config.mongodb.password) {
		var mongoUrl = 'mongodb://' + config.mongodb.host + '/' + config.mongodb.database;
	mongoose.connect(mongoUrl);
	} else if (config.mongodb.host && config.mongodb.database &&
		config.mongodb.username && config.mongodb.password) {
		var mongoUrl = 'mongodb://' + config.mongodb.username + ':';
		mongoUrl += config.mongodb.password + '@';
		mongoUrl += config.mongodb.host + '/' + config.mongodb.database;
		mongoose.connect(mongoUrl);
	} else {
		// No Mongo Config
	}
}


db.on('error', function (err) {
	if (err == 'MongoError: connect ECONNREFUSED') {
		debugError('[MongoDB] Could not connect to MongoDB!!');
	} else {
		debugError('[MongoDB] ' + err);
	}
});


/**
 * Escape special characters in the given string of html.
 *
 * @param  {String} html
 * @return {String}
 */
// module.exports = {
//   escape: function(html) {
//     return String(html)
//       .replace(/&/g, '&amp;')
//       .replace(/"/g, '&quot;')
//       .replace(/'/g, '&#39;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;');
//   },
	// /**
	//  * Unescape special characters in the given string of html.
	//  *
	// * @param  {String} html
	// * @return {String}
	// */
//   unescape: function(html) {
//     return String(html)
//       .replace(/&amp;/g, '&')
//       .replace(/&quot;/g, '"')
//       .replace(/&#39;/g, '\'')
//       .replace(/&lt;/g, '<')
//       .replace(/&gt;/g, '>');
//   }
// };



