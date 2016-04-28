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

  describe('ProfileImageRouterTests', function () {
    describe('GET /membership/image', function () {
      // get all membership images urls
    });
    describe('GET /membership/[membershipId]/image', function () {});
    describe('PUT /membership/[membershipId]/image', function () {});
    describe('DELETE /membership/[membershipId]/image', function () {});
  });
})();