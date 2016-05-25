(function userRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var fs = require('fs');
  var request = require('supertest');
  var should = require('should');
  
  var testUtils = require('../test/testUtils.js');

  describe('UserRouterRouter', function () {
    var email = 'router@test.suite.user';
    var tokenFile = './user-files/'+email+'-test.json';
    var token ='';

    after(function afterAllTests() {
      if (fs.existsSync(tokenFile)) {
        fs.unlinkSync(tokenFile);
      }
    });

    describe('POST /user/connect', function postUserConnect() {
      it('should failed to get authentication token when no email', function (done) {
        function onFailedToGetConnectionToken(data) {
          var content = JSON.parse(data.message);
          assert.ok(content.message === 'missing-input', 'error is a missing input');
          assert.ok(content.details.key === 'email', 'missing input is email');
          done();
        }

        testUtils.REST()
          .post('/user/connect')
          .send({})
          .expect(500)
          .end(testUtils.parseResponse.bind (null, onFailedToGetConnectionToken));
      });

      it('should successfully request authentication token', function (done) {
        function onTokenStored(data) {
          assert.ok(data.output === 'stored', 'token file stored');
          var file = require('../user-files/' + email + '-test.json');
          assert.ok(file.to === email, 'token sent to right email');
          done();
        }

        testUtils.REST()
          .post('/user/connect')
          .send({email: email, subject:'test'})
          .expect(200) //Status code
          .end(testUtils.parseResponse.bind (null, onTokenStored));
      });
    });

    describe('GET /user/connect', function postUserConnect() {
      it('should successfully use connection token to get authToken', function (done) {
        function onAuthTokenGenerated (error,response) {
          assert.ok ( error === null, 'no errors requesting token');
          token = JSON.parse(response.text).token;
          assert.ok ( token.length>10, 'got a token');
          done();
        }
        var file = require(testUtils.getTokenFile(email));
        var connectionToken = file.text;
        assert.ok ( connectionToken !== undefined, 'authenticationToken read from file');

        testUtils.REST()
          .get('/user/connect/'+connectionToken)
          .expect(200) //Status code
          .end(onAuthTokenGenerated);
      });

      it('should failed to get authToken when connection string is wrong', function (done) {
        testUtils.REST()
          .get('/user/connect/wrongConnectionString')
          .expect(406, {}, done); //Status code
      });
    });

    describe('POST /user', function postUserConnect() {
      it('should failed to update user when not authorized', function (done) {
        testUtils.REST()
          .post('/user')
          .send({ gender: 'female' })
          .expect(401, {}, done); //Status code
      });

      it('should successfully update a user', function (done) {
        function gotUpdatedUser (data) {
          assert.ok((data.user.gender === 'female'), "user is female");
          done();
        }

        testUtils.REST()
          .post('/user')
          .set('authorization', token)
          .send({ user: { gender: 'female' }})
          .expect(200)
          .end(testUtils.parseResponse.bind (null, gotUpdatedUser)); //Status code
      });
    });

    describe('GET /user', function postUserConnect() {
      it('should failed to update user when not authorized', function (done) {
        testUtils.REST()
          .get('/user')
          .expect(401, {}, done); //Status code
      });

      it('should successfully update a user', function (done) {
        function gotUser (error, response) {
          assert.ok(error === null, 'no errors requesting token');
          if (response) {
            var user = JSON.parse(response.text).user;
            assert.ok((user.email === email), 'user email is as expected');
          }
          done();
        }

        testUtils.REST()
          .get('/user')
          .set('authorization', token)
          .expect(200)
          .end(gotUser); //Status code
      });
    });
  });
})();