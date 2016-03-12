var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var db = mongoose.connection;
// var P = require('bluebird');
var shortid = require('shortid');
var bcrypt = require('bcrypt-nodejs');
var P = require('bluebird');
var debug = require('debug')('flarum:dbModels');


var userSchema = new Schema({
	_id: String,
	name: String,
	username: String,
	email: String,
	password: String,
	token: String,
	lastLoggedIn: String,
	createdIn: String,
	avatar: String,
	admin: Boolean,
	userId: Number,
	github: {
		id: String
	},
});


/**
	* Generate hash for password, aka encrypt password
	*
	* @param  {String} password  - the password entered
	*
	* @return string
	**/
userSchema.methods.generateHash = function (password) { //
	return bcrypt.hashSync(password, bcrypt.genSaltSync(12), null);
};


/**
	* Check if password entered is right
	* Compares encrypted password with entered password
	*
	* @param  {String} password
	*
	* @return boolean
	*
	* @example {@lang javascript}
	* user.validPassword("pass1234")
	**/
userSchema.methods.validPassword = function (password) { //
	console.log(this.password);
	return bcrypt.compareSync(password, this.password);
};

var forumSettingsSchema = new Schema({
	name: String,
	description: String,
	content: Schema.Types.Mixed
});

var forumTagsSchema = new Schema({
	_id: String,
	name: String,
	slug: String,
	description: String,
	color: String,
	default_sort: String,
	is_restricted: Boolean,
	is_hidden: Boolean,
	discussions_count: Number
});

var forumPostsSchema = new Schema({
	title: String,
	content: String,
	replyCount: Number,
	tags: Array,
	start_time: Date,
	start_user_id: { type: Number, ref: 'User' },
	start_post_id: Number,
	last_time: Date,
	last_user_id: { type: Number, ref: 'User' },
	last_post_id: Number,
	last_post_number: Number,
	is_approved: Boolean,
	is_locked: Boolean,
	is_sticky: Boolean,
	deleted: Boolean,
	deletedForever: Boolean
});


// SCHEMAS
var User = mongoose.model('User', userSchema);
var ForumSetting = mongoose.model('ForumSetting', forumSettingsSchema);
var ForumTag = mongoose.model('ForumTag', forumTagsSchema);
var ForumPost = mongoose.model('ForumPost', forumPostsSchema);

/**
	* Instead of Model.find(), uses Model.aggregate() to look for documents
	* Supposedly "learns" from what it does...
	*
	* @param {Schema}   model    - the model to find the documents in; ex: User, ForumSetting
	* @param {Object}   what     - the object look for documents, aka Model.find(OBJECT), but using Model.match
	* @param {Function} callback - callback function
	*
	* @example {@lang javascript}
	* ModelFind(User, { username: "username" }, function (err, user) {
	*   if (err) throw err;
	*   console.log(user);
	* })
	**/
var ModelFind = function (model, what, callback) { //
	P.resolve(model.aggregate().match(what).exec()).then(function (doc) {
		callback(null, doc)
	}).catch(function (err) {
		callback(err, null)
	});
}

var GetLatestId = function (model, callback) {
	ModelFind(model, { }, function (err, what) {
		callback(null, what && (what.length + 1) || 1);
	})
}

module.exports = {
	user: User,
	forum: {
		settings: ForumSetting,
		tags: ForumTag,
		posts: ForumPost
	},
	find: ModelFind,
	latestId: GetLatestId
};
