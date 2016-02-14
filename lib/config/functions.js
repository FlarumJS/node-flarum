var mongoose = require('mongoose');
var connected;

var connectMongo = function (mongo, callback) {
	connected = false
	if (mongo.host && mongo.database && !mongo.username && !mongo.password) {
		var mongoUrl = 'mongodb://' + mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);

		mongoose.connection.on('error', function (err) {
			connected = true;
			if (!callback) return null || callback('Could not connect to MongoDB', null);
		});
		mongoose.connection.once('open', function() {
			connected = true;
			if (!callback) return mongoose.connection || callback(null, mongoose.connection);
		});

		setTimeout(function () {
			if (!connected) return null || callback('Could not connect to MongoDB', null);
		}, 3500)

	} else if (mongo.host && mongo.database && mongo.username && mongo.password) {

		var mongoUrl = 'mongodb://' + mongo.username + ':';
		mongoUrl += mongo.password + '@';
		mongoUrl += mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);

		mongoose.connection.on('error', function (err) {
			connected = true;
			if (!callback) return null || callback('Could not connect to MongoDB', null);
		});
		mongoose.connection.once('open', function () {
			connected = true;
			if (!callback) return mongoose.connection || callback(null, mongoose.connection);
		});

		setTimeout(function () {
			if (!connected) return null || callback('Could not connect to MongoDB', null);
		}, 3500)

	} else {
		if (!callback) return null || callback(null, null);
	}
}

var getFalseDiscussionList = function () {
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

module.exports = {
	connectMongo: connectMongo,
	getFalseDiscussionList: getFalseDiscussionList
}
