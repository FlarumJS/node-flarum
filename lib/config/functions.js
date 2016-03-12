var mongoose = require('mongoose');
var debugError = require('debug')('flarum:error');
var connected;

/**
	* Connect to mongodb via mongoose
	*
	* @param {Object}   mongo      - object containing host & database; optional: username & password
	* @param {Function} callback   - callback function
	*
	* @return object
**/
var connectMongo = function (mongo, callback) {
	connected = false;

	if (!mongo || typeof mongo !== 'object') return { error: 'INVALID ARGUMENTS: No "mongo" typeof object argument found', mongo: null }

	if (mongo.host && mongo.database && !mongo.username && !mongo.password) {
		var mongoUrl = 'mongodb://' + mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);

		mongoose.connection.on('error', function (err) {
			connected = true;
			if (!callback) {
				return { error: 'Could not connect to MongoDB; ' + err, mongo: null }
			} else {
				callback('Could not connect to MongoDB; ' + err, null)
			}
		});
		mongoose.connection.on('open', function (ref) {
			connected = true;

			if (callback) callback(null, mongoose.connection);

			return { error: null, mongo: true }

		});


		setTimeout(function () {
			if (!connected) {
				if (!callback) {
					return { error: 'Could not connect to MongoDB; ERROR: Timeout', mongo: null }
				} else {
					callback('Could not connect to MongoDB; ERROR: Timeout', null);
				}
			}

		}, 7500)

	} else if (mongo.host && mongo.database && mongo.username && mongo.password) {

		var mongoUrl = 'mongodb://' + mongo.username + ':';
		mongoUrl += mongo.password + '@';
		mongoUrl += mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);

		mongoose.connection.on('error', function (err) {
			connected = true;
			if (!callback) {
				return { error: 'Could not connect to MongoDB; ' + err, mongo: null }
			} else {
				callback('Could not connect to MongoDB; ' + err, null)
			}
		});
		mongoose.connection.on('open', function (ref) {
			connected = true;

			if (!callback) {
				return { error: null, mongo: mongoose.connection }
			} else {
				callback(null, mongoose.connection)
			}

		});

		setTimeout(function () {
			if (!connected) {
				if (!callback) {
					return { error: 'Could not connect to MongoDB; ERROR: Timeout', mongo: null }
				} else {
					callback('Could not connect to MongoDB; ERROR: Timeout', null);
				}
			}

		}, 7500)

	} else {
		if (!callback) {
			return { error: 'Invalid credentials provided; Either (host+db) or (host+db+username+password) are allowed', mongo: null }
		} {
			callback(null, null);
		}
	}
}


/**
	* Get a false discussion list; for development only
	*
	* @return object
**/
var getFalseDiscussionList = function () {
	var falseDiscussionList = {
		posts: [
			{
				title: 'lol',
				slug: '1-test-discussion',
				start_username_id: '1',
				start_time: "Thu, 01 Jan 1970 00:00:02 GMT",
				last_username: 'hola',
				replyCount: 0,
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


/**
	* Throw an error without stopping nodejs program
	*
	* @param {String}  message  - message to debug
	* @param {Error}   error    - unexpected error, if any, that returned from the function
	*
	* @return false
**/
var throwError = function (message, error) {
	debugError(message);
	if (error) debugError(error);
	return false;
}

module.exports = {
	connectMongo: connectMongo,
	getFalseDiscussionList: getFalseDiscussionList,
	throwError: throwError
}
