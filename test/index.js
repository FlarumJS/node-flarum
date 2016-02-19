var should = require('chai').should();
var assert = require('assert');

var functions = require('../lib/config/functions');
var connectMongo = functions.connectMongo;
var falseDiscussionList = functions.getFalseDiscussionList;

describe('Functions', function () {
	describe('#connectMongo', function () {
		this.timeout(10000);
		it('connect to flarumjs-test database', function (done) {
			connectMongo({ host: '127.0.0.1:27017', database: 'node-flarum' }, function (err, mongo) { if (err) throw err; if (!mongo) throw new Error('Could not find mongo instance'); done(); });
		});
	});
});
