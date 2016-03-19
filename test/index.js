var should = require('chai').should(),
assert = require('chai').assert,
		// assert = require('assert'),
		express = require('express'),
		request = require('supertest'),
		passport = require('passport'),
		routes = require('../lib/routes'),
		index = require('../index'),
		passportConfig = require('../lib/config/passport');

		var functions = require('../lib/config/functions');
		var connectMongo = functions.connectMongo;
		var falseDiscussionList = functions.getFalseDiscussionList;


		var app = express();
		app.use(index);

// describe('Routing', function () {

//   var app = express();

//   app.use(index);

//   // routes(app, passportConfig('/', passport));

//   before(function (done) {
//     connectMongo({ host: '127.0.0.1:27017', database: 'node-flarum' }, function (err, mongo) { if (err) throw err; if (!mongo) throw new Error('Could not find mongo instance'); done(); });
//     done();
//   });
// });

describe('Functions', function () {
	describe('#connectMongo', function () {
		this.timeout(10000);
		it('connect to flarumjs-test database', function (done) {
			connectMongo({ host: '127.0.0.1:27017', database: 'node-flarum' }, function (err, mongo) { if (err) throw err; if (!mongo) throw new Error('Could not find mongo instance'); done(); });
		});
	});
});

describe('SignUp', function () {
	var newUserInfo = {
		username: 'username',
		email: 'email@domain.com',
		password: 'password',
		passwordCheck: 'password'
	}
	it('should return success when signing up with non-repeating info', function (done) {

		app.post('/api/signup');

		// request(app)
		// .post('/api/signup')
		// .type('form')
		// .send(newUserInfo)
		// .field('username', 'username')
		// .field('email', 'email@domain.com')
		// .field('password', 'password')
		// .field('passwordCheck', 'password')
		// .end(function (err, res) {
		// 	if (err) throw err;

		// 	console.log(res.body);

		// 	res.body.should.be.an('object');
		// 	assert.equal(res.body.success, true);
		// 	res.body.errors.should.equal([ ]);
		// 	res.status.should.equal(200);

		// 	done();

		// })
	})
})

describe('Discussions', function () {
	it('should return discussion list at /api/discussionList', function (done) {
		request(app)
		.post('/api/discussionList')
		.end(function (err, res) {
			if (err) throw err;

			res.status.should.equal(200);
			res.body.should.be.an('object');

			done();
		})
	});
	it('should return success when creating a new discussion', function (done) {
		request(app)
		.post('/api/discussion/create')
	})
})
