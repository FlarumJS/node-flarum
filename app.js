var http = require('http');
var connect = require('connect');
var bodyParser = require('connect-hopeful-body-parser');

var flarum = require('./index');

var app = connect();

app.use(bodyParser());
app.use(flarum);

http.createServer(app).listen(8080);
