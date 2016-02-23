var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var db = mongoose.connection;
// var P = require('bluebird');
var shortid = require('shortid');
var bcrypt = require('bcrypt-nodejs');
var P = require('bluebird')


// function looseSchema () {
// 	return new mongoose.Schema({}, {strict: false});
// }
// var Indexes = db.model('indexes', looseSchema());
// Indexes.next = function(collection) {
// 	if (typeof collection !== 'string') {
// 		collection = collection.collection.name;
// 	}
// 	var query = {collection: collection};
// 	var inc   = {$inc: {next: 1}};
// 	var opts = {upsert: true};
// 	return P.resolve(Indexes.findOneAndUpdate(query, inc, opts).lean().exec()).then(function(index) {
// 		return index.next.toString();
// 	});
// };


var userSchema = new Schema({
	name: String,
	username: String,
	email: String,
	password: String,
	id: Number,
	lastLoggedIn: String,
	createdIn: String,
	admin: Boolean,
	google: {
		id: String,
		token: String
	}
});

userSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(12), null);
};

userSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

var forumSettingsSchema = new Schema({
	name: String,
	description: String,
	content: Schema.Types.Mixed
});

var forumTagsSchema = new Schema({
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
	replyCount: Number,
	tags: Array,
	start_time: Date,
	start_user_id: Number,
	start_post_id: Number,
	last_time: Date,
	last_user_id: Number,
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

module.exports = {
	user: User,
	forum: {
		settings: ForumSetting,
		tags: ForumTag,
		posts: ForumPost
	},
	find: function (model, what, callback) {
		P.resolve(model.aggregate().match(what).exec()).then(function (doc) {
			callback(null, doc)
		}).catch(function (err) {
			callback(err, null)
		});
	}
};
