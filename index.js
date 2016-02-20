var express = require('express');
var hbs = require('hbs');
var path = require('path');
var debugError = require('debug')('flarum:error');
var fs = require('fs');
var config, routes;

var passport = require('./lib/config/passport')
var functions = require('./lib/config/functions');


// var configFileDirname = path.join(__dirname + '/../../flarum/config.json'); // production
var configFileDirname = path.join(__dirname + '/flarum/config.json'); // development

var connectMongo = functions.connectMongo;

var mongoose = require('mongoose');
var db = mongoose.connection;

var app = module.exports = express();


app.set('views', path.join(__dirname, 'lib/views'));
app.set('view engine', 'hbs');
app.set('port', process.env.PORT || 8080);

hbs.registerPartials(__dirname + '/lib/views/partials');


app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '/lib/public')));


fs.readFile(configFileDirname, 'utf8', function (err, data) {
	
	if (!err && !data) {
		fs.writeFile('flarum/config.json', '{}', function (err2) {
			if (err2) throw err2;
			console.log('[FLARUM] Config File Set Up!');
			
			config = require(configFileDirname);
			
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
				
				config = require(configFileDirname);
				
				if (config.mongodb) connectMongo(config.mongodb);
				
				setUpRoutes();
				app.use('/', routes);
			});
		});
	} else if (err) {
		var error =  new Error('[FLARUM] ' + err);
		throw error;
	} else if (data) {
		
		config = require(configFileDirname);
		
		setUpRoutes()
		app.use('/', routes);
		
		if (config.mongodb) connectMongo(config.mongodb);
	}
})




db.on('error', function (err) {
	if (err == 'MongoError: connect ECONNREFUSED') {
		debugError('[MongoDB] Could not connect to MongoDB!!');
	} else {
		debugError('[MongoDB] ' + err);
	}
});

function setUpRoutes () {
	routes = require('./lib/routes');
	routes.set('views', path.join(__dirname, 'lib/views'));
	routes.set('view engine', 'hbs');
	app.use('/', routes);
}
