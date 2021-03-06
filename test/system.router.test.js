(function systemRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var testUtils = require('./testUtils.js');

  describe('systemRouterTest', function systemRouterTest () {
    describe('/api/system/ping', function getSystemPing() {
      it('should return pong', function shouldReturnPong (done) {
        function gotPong (data) {
          assert.ok(data.result === 'pong', 'result is pong');
          done();
        }

        testUtils.REST()
          .get('/api/system/ping')
          .expect(200)
          .end(testUtils.parseResponse.bind (null, gotPong));
      });
    });
    describe('/api/system/version', function getSystemVersion () {
      it('should get right version number', function shouldGetVersion (done) {
        var version = require('../package.json').version;

        testUtils.REST()
          .get('/api/system/version')
          .expect(200)
          .end(function gotVersion (error, response) {
            assert.ok ( error === null, 'no errors requesting token');
            assert.ok ( JSON.parse(response.text).version === version, 'version matches package.json');
            done();
          });
      });
    });
    describe('/api/system/api', function getSystemApi() {
      it('should get the api', function shouldGetAPI(done) {
        var version = require('../package.json').version;

        testUtils.REST()
          .get('/api/system/api')
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
