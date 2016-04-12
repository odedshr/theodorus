(function systemRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var fs = require('fs');
  var md5 = require('md5');
  var request = require('supertest');
  var should = require('should');
  var winston = require('winston');

  var config = require('../helpers/config.js');
  var db = require('../helpers/db.js');

  var url = config('testsURL');

  describe('systemRouterTest', function systemRouterTest () {
    describe('/system/ping', function getSystemPing() {
      it('should return pong', function shouldReturnPong (done) {
        request(url)
          .get('/system/ping')
          .expect(200)
          .end(function gotPong (error, response) {
            assert.ok(error === null, 'no errors requesting token');
            assert.ok(JSON.parse(response.text).result === 'pong', 'result is pong');
            done();
          });
      });
    });
    describe('/system/version', function getSystemVersion () {
      it('should get right version number', function shouldGetVersion (done) {
        var version = require('../package.json').version;

        request(url)
          .get('/system/version')
          .expect(200)
          .end(function gotVersion (error, response) {
            assert.ok ( error === null, 'no errors requesting token');
            assert.ok ( JSON.parse(response.text).version === version, 'version matches package.json');
            done();
          });
      });
    });
    describe('/system/api', function getSystemApi() {
      it('should get the api', function shouldGetAPI(done) {
        var version = require('../package.json').version;

        request(url)
          .get('/system/api')
          .expect(200)
          .end(function gotAPI(error, response) {
            assert.ok ( error === null, 'no errors');
            assert.ok ( JSON.parse(response.text).version === version, 'api version matches package.json');
            done();
          });
      });
    });
  });
})();