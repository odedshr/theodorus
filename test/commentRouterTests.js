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

  describe('communityRouterRouter', function () {
    describe('GET /opinion/[opinionId]/comments', function () {});
    describe('PUT /opinion/[opinionId]/comments', function () {});
    describe('POST /comment', function () {});
    describe('GET /comment/[commentId]', function () {});
    describe('POST /comment/[commentId]', function () {});
    describe('DELETE /comment/[commentId]]', function () {});
    describe('GET /comment/[commentId]/comments', function () {});
    describe('PUT /comment/[commentId]/comments', function () {});
  });
})();