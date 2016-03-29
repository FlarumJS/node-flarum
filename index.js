var express = require('express');
var session = require('express-session');
var hbs = require('hbs');
var path = require('path');
var fs = require('fs');
var config;
var routes;

var passport = require('passport');
var flash    = require('connect-flash');

var helmet = require('helmet');
var toobusy = require('toobusy-js');

var passportjs = require('./lib/config/passport');

var functions = require('./lib/config/functions');

var flarumFolderDirectory;

if (process.env.NODE_ENV === 'development') {
  // DEVELOPMENT: Set FlarumFolderDirectory to same directory w/o node_modules
  flarumFolderDirectory = path.join(__dirname, '/flarum');
} else {
  // PRODUCTION: Set FlarumFolderDirectory up because we are in node_modules
  flarumFolderDirectory = path.join(__dirname, '/../../flarum');
}

var connectMongo = functions.connectMongo;
var throwError = functions.throwError;
var createFlarumFolder = functions.createFlarumFolder;
var createConfigFile = functions.createConfigFile;

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

app.use(helmet());
toobusy.maxLag(500);
app.use(function (req, res, next) {
  if (toobusy()) {
    res.status(429).json({ errors: ['The server is busy. Please try again shortly']}).end();
  }
  next();
});

passportjs((app.path() !== '//' && app.path() || '/'), passport);


fs.readFile(flarumFolderDirectory + '/config.json', 'utf8', function (err, data) {

  if (!err && !data) {

    createConfigFile(flarumFolderDirectory, function (err1) {
      if (err2) return false;
      console.log('[FLARUM] Config File Set Up!');

      config = require(flarumFolderDirectory + './config.json');

      if (config.mongodb) connectMongo(config.mongodb);

      setUpRoutes();
      // app.use('/', routes);
    });
  } else if (err) {
    console.log('[FLARUM] Config File Not Found Or Could Not Be Written');

    createFlarumFolder(flarumFolderDirectory, function (err1) {
      if (err1) return false;
      console.log('[FLARUM] Flarum/ Folder Created!');

      createConfigFile(flarumFolderDirectory, function (err2) {
        if (err2) return false;
        console.log('[FLARUM] Config File Set Up!');

        config = require(path.join(flarumFolderDirectory, 'config.json'));

        if (config.mongodb) connectMongo(config.mongodb);

        setUpRoutes();
        // app.use('/', routes);
      });
    });
  } else if (data) {

    config = require(flarumFolderDirectory + '/config.json');

    setUpRoutes()
    app.use('/', routes);

    if (config.mongodb) connectMongo(config.mongodb);
  }
});

db.on('error', function (err) {
  if (err == 'MongoError: connect ECONNREFUSED') {
    throwError('[MongoDB] Could not connect to MongoDB!!');
  } else {
    throwError('[MongoDB] ', err);
  }
});

function setUpRoutes () {
  routes = require('./lib/routes');
  routes(app, passport);
}


process.on('SIGINT', function() {
  // calling .shutdown allows your process to exit normally
  toobusy.shutdown();
  process.exit();
});
