(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var fs = require('fs');
  var md5 = require('md5');
  var request = require('supertest');
  var should = require('should');
  var winston = require('winston');

  var config = require('../helpers/config.js');
  var db = require('../helpers/db.js');

  var dbModels = {};
  var url = config('testsURL');

  describe('communityRouterTest', function communityRouterTest () {
    var email = 'router@test.suite.topic';
    var tokenFile = '../user-files/debug_'+email+'.json';
    var token ='';

    function setToken (done, err, response) {
      if (err) {
        throw err;
      } else {
        token =  JSON.parse (response.text).token;
      }
      done();
    }
    function connect (done) {
      var connectToken = require(tokenFile).text;
      request(url).get('/user/connect/'+connectToken).end(setToken.bind(null, done));
    }

    before( function (done) {
      if (!fs.existsSync(tokenFile)) {
        request(url).post('/user/connect').send({email: email}).end(connect.bind(null, done));
      } else {
        connect(done);
      }
    });

    describe('PUT /community/[communityId]/topics', function putCommunityTopic () {
      it ('fail to add topic because content is too long', function () {});
      it ('successfully add a topic', function () {});
    });
    describe('GET /community/[communityId]/topics', function getCommunityTopics () {});
    describe('POST /topic', function postCommunity () {});
    describe('GET /topic/[topicId]', function getTopic () {});
    describe('POST /topic/[topicId]', function postTopic () {});
    describe('DELETE /topic/[topicId]', function deletTopic () {});
  });
})();