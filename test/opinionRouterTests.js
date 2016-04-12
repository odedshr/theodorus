(function opinionRouteTestEnclosure() {
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

  describe('opinionRouterRouter', function () {
    describe('GET /topic/[topicId]/opinions', function () {});
    describe('PUT /topic/[topicId]/opinions', function () {});
    describe('POST /opinion', function () {});
    describe('GET /opinion/[opinionId]', function () {});
    describe('POST /opinion/[opinionId]', function () {});
    describe('DELETE /opinion/[opinionId]', function () {});
  });
})();