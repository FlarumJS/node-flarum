var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs');
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
	var connected = false;
	var mongoUrl = '';

	if (!mongo || typeof mongo !== 'object') return {
		error: 'INVALID ARGUMENTS: No "mongo" typeof object argument found',
		mongo: null,
	};

	if (mongo.host && mongo.database && !mongo.username && !mongo.password) {
		mongoUrl = 'mongodb://' + mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);

		mongoose.connection.on('error', function (err) {
			connected = true;
			if (!callback) {
				return { error: 'Could not connect to MongoDB; ' + err, mongo: null };
			} else {
				callback('Could not connect to MongoDB; ' + err, null);
			}
		});

		mongoose.connection.on('open', function () {
			connected = true;

			if (callback) callback(null, mongoose.connection);

			return { error: null, mongo: true };

		});

		setTimeout(function () {
			if (!connected) {
				if (!callback) {
					return {
						error: 'Could not connect to MongoDB; ERROR: Timeout',
						mongo: null,
					};
				} else {
					callback('Could not connect to MongoDB; ERROR: Timeout', null);
				}
			}

		}, 7500);

	} else if (mongo.host && mongo.database && mongo.username && mongo.password) {

		mongoUrl = 'mongodb://' + mongo.username + ':';
		mongoUrl += mongo.password + '@';
		mongoUrl += mongo.host + '/' + mongo.database;
		mongoose.connect(mongoUrl);

		mongoose.connection.on('error', function (err) {
			connected = true;
			if (!callback) {
				return {
					error: 'Could not connect to MongoDB; ' + err,
					mongo: null,
				};
			} else {
				callback('Could not connect to MongoDB; ' + err, null);
			}
		});

		mongoose.connection.on('open', function (ref) {
			connected = true;

			if (!callback) {
				return {
					error: null,
					mongo: mongoose.connection,
				};
			} else {
				callback(null, mongoose.connection);
			}

		});

		setTimeout(function () {
			if (!connected) {
				if (!callback) {
					return {
						error: 'Could not connect to MongoDB; ERROR: Timeout',
						mongo: null,
					};
				} else {
					callback('Could not connect to MongoDB; ERROR: Timeout', null);
				}
			}

		}, 7500);

	} else {
		if (!callback) {
			return {
				error: 'Invalid credentials provided; Either (host+db)' +
				' or (host+db+username+password) are allowed',
				mongo: null,
			};
		} else {
			callback(null, null);
		}
	}
};

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
				last_username: 'hola',
				replyCount: 0,
				tags: [
					{
						color: 'red',
						label: 'Hi',
					}, {
						color: 'yellow',
						label: 'Bye',
					},
				],
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
						label: 'Blue',
					}, {
						color: 'lightgray',
						label: 'General',
					},
				],
			},
		],
	};
	return falseDiscussionList;
};

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
};

/**
* Create the flarum/ directory
*
* @param {String}   flarumFolderDirectory    -  the flarum/ folder directory
* @param {Function} callback                 -  callback for function
*
* @example {@lang javascript}
* createFlarumFolder('/Users/Anonymous/FlarumJS/flarum', function (err) {
*   if (err) throw err;
*   // Do Something Else
* })
**/
var createFlarumFolder = function (flarumFolderDirectory, callback) {
	fs.mkdir(flarumFolderDirectory, function (err) {
		if (err) {
			console.log('============================================================');
			console.log('Error while trying to create flarum/ directory');
			console.log(err);
			console.log('============================================================');
			return callback(err);
		}

		callback();
	});
};

/**
 * Create the config.json file in the flarum/ directory
 *
 * @param  {String}   flarumFolderDirectory - the flarum/ folder directory
 * @param  {String}   content               - the content to write into config.json
 * @param  {Function} callback              - callback
 */

var createConfigFile = function (flarumFolderDirectory, content, callback) {
	if (typeof content === 'function' || !content || !callback) {
		callback = content || function () {};

		content = '{}';
	}

	fs.writeFile(path.join(flarumFolderDirectory, 'config.json'), content, function (err) {
		if (err) {
			console.log('============================================================');
			console.log('Error while trying to create flarum/config.json file');
			console.log(err);
			console.log('============================================================');
		}

		callback(err);
	});
};

/**
 * Convert simple string to a valid url, or slug
 *
 * @param  {String} text - text to convert to slug
 *
 * @return {String}      text converted to valid url, or slug
 */
var sluglify = function (text) {
	return text.toString().toLowerCase()
		.replace(/\s+/g, '-')           // Replace spaces with -
		.replace(/[^\w\-]+/g, '')       // Remove all non-word chars
		.replace(/\-\-+/g, '-')         // Replace multiple - with single -
		.replace(/^-+/, '')             // Trim - from start of text
		.replace(/-+$/, '');            // Trim - from end of text
}

module.exports = {
	connectMongo: connectMongo,
	getFalseDiscussionList: getFalseDiscussionList,
	throwError: throwError,
	createFlarumFolder: createFlarumFolder,
	createConfigFile: createConfigFile,
};
