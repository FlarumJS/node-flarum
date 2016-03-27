var should = require('chai').should(),
assert = require('chai').assert;
var express = require('express');
var request = require('supertest');
var passport = require('passport');
var routes = require('../lib/routes');
// var models = require('../models/index');
var index = require('../index');
var passportConfig = require('../lib/config/passport');

var functions = require('../lib/config/functions');
var connectMongo = functions.connectMongo;
var falseDiscussionList = functions.getFalseDiscussionList;


var app = express();
app.use(index);

describe('Functions', function () {
  this.timeout(5000);

  it('#connectMongo - connect to flarumjs-test database', function (done) {
    this.timeout(10000);
    connectMongo({
      host: '127.0.0.1:27017',
      database: 'node-flarum'
    }, function (err, mongo) {
      should.not.exist(err);
      should.exist(mongo);
      done();
    });
  });

  it('#createFlarumFolder - should not return error', function (done) {
    functions.createFlarumFolder('./test/flarum', function (err) {
      should.not.exist(err);
      done();
    });
  });

  it('#createConfigFile - should not return error', function (done) {
    functions.createConfigFile('./test/flarum', function (err) {
      should.not.exist(err);
      done();
    })
  });
});

// describe('Install', function () {

//   it('should return no data posted when no data is posted', function (done) {
//     request(app)
//     .post('/flarum/install')
//     .end(function (err, res) {
//       if (err) throw err;

//       if (res.status == 403) {
//         throw new Error(JSON.stringify(res.body, null, 4));
//       } else {
//         res.status.should.equal(403);
//         // res.body.should.be.a('string');
//         res.body.should.equal('No data was sent!');
//       }

//       done();
//     });
//   });

//   it('should return \"Forum Title can\'t be empty\" when no title is sent', function (done) {
//     request(app)
//     .post('/flarum/install')
//     .field('title', '')
//     .end(function (err, res) {
//       if (err) throw err;

//       res.status.should.equal(403);
//       // res.body.should.be.a('string');
//       res.body.should.equal('Forum Title can\'t be empty');

//       done();
//     })
//   })
// });

// describe('Discussions', function () {
//   it('should return discussion list at /api/discussions', function (done) {
//     request(app)
//     .get('/api/discussions')
//     .end(function (err, res) {
//       if (err) throw err;

//       res.status.should.equal(200);
//       res.body.should.be.an('object');

//       done();
//     })
//   });
//   // it('should return success when creating a new discussion', function (done) {
//   // 	request(app)
//   // 	.post('/api/discussion/create')
//   // })
// });
