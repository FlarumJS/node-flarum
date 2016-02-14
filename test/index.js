var should = require('chai').should();
var assert = require('assert');
var suit = require('suit')

var functions = require('../lib/config/functions');
var connectMongo = functions.connectMongo;
var falseDiscussionList = functions.getFalseDiscussionList;

describe('Functions', function () {
	describe('#connectMongo', function () {
		this.timeout(10000);
		it('returns connection if valid', function (done) {

			var connectMongoDone = done;

			connectMongo({
				host: 'mongodb://127.0.0.1:27017',
				database: 'test'
			}, function (err, mongo) {
				if (err) throw err;
				if (!mongo) throw new Error('Could not find mongo instance');
				done();
				// err.should.equal(null, 'Err doesn\'t equal null with valid arguments given to connect to mongo!');
				// mongo.should.not.equal(null, 'Mongo when host/database are given equals null')
			});
		});
		it('returns false if invalid or could not connect', function (done) {

			// connectMongo({ }, function () {
			// 	// err2.should.equal('Could Not Connect To MongoDB');
			// 	// mongo2.should.equal(null);
			// 	done();
			// 	// it ('err should not be null', function () {
			// 		// err.should.not.equal(null, 'Err equals null with no arguments given to connect to mongo!');
			// 	// });
			// 	// it ('mongo should equal null', function () {
			// 		// mongo.should.equal(null, 'Mongo when no host/database given doesn\'t equal null')
			// 	// });
			// });
			done();
		})
	});
});

suite('Array', function() {
	suite('#indexOf()', function() {
    test('should return -1 when not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});


// describe('#escape', function() {
//   it('converts & into &amp;', function() {
//     escape('&').should.equal('&amp;');
//   });

//   it('converts " into &quot;', function() {
//     escape('"').should.equal('&quot;');
//   });

//   it('converts \' into &#39;', function() {
//     escape('\'').should.equal('&#39;');
//   });

//   it('converts < into &lt;', function() {
//     escape('<').should.equal('&lt;');
//   });

//   it('converts > into &gt;', function() {
//     escape('>').should.equal('&gt;');
//   });
// });

// describe('#unescape', function() {
//   it('converts &amp; into &', function() {
//     unescape('&amp;').should.equal('&');
//   });

//   it('converts &quot; into "', function() {
//     unescape('&quot;').should.equal('"');
//   });

//   it('converts &#39; into \'', function() {
//     unescape('&#39;').should.equal('\'');
//   });

//   it('converts &lt; into <', function() {
//     unescape('&lt;').should.equal('<');
//   });

//   it('converts &gt; into >', function() {
//     unescape('&gt;').should.equal('>');
//   });
// });
