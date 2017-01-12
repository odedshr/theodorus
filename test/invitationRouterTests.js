(function communityRouteTestEnclosure() {
  'use strict';

  var assert = require('assert');
  var fs = require('fs');
  var md5 = require('md5');
  var request = require('supertest');
  var should = require('should');
  var winston = require('winston');

  var helpers = '../src/backend/helpers/';
  var config = require(helpers + 'config.js');
  var db = require(helpers + 'db.js');

  var dbModels = {};
  var url = config('testsURL');

  describe('communityRouterRouter', function() {
    describe('GET /community/[communityId]/decline', function() {
      // fail to decline if no invitation
    });
    describe('GET /community/[communityId]/invitations', function() {});
    describe('PUT /community/[communityId]/invitations', function() {});
    describe('GET /user/invitations', function() {});
  });
})();
