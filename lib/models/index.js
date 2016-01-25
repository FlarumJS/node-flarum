var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var db = mongoose.connection;
// var P = require('bluebird');
var shortid = require('shortid');
var bcrypt = require('bcrypt-nodejs');


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
	admin: Boolean
});

userSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(12), null);
};

userSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

var forumSettingsSchema = new Schema({
	title: String,
	description: String,
	welcomeBanner: {
		title: String,
		description: String
	}
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


module.exports = {
	user: mongoose.model('User', userSchema),
	forum: {
		settings: mongoose.model('ForumSetting', forumSettingsSchema),
		tags: mongoose.model('ForumTag', forumTagsSchema),
		posts: mongoose.model('ForumPost', forumPostsSchema)
	}
};
