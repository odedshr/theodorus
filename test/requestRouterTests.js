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

  describe('communityRouterRouter', function () {
    describe('GET /community/[communityId]/requests', function () {
      //fail to get list of requests if not member
      //   get list of requests
    });
    describe('PUT /community/[communityId]/requests', function () {});
    describe('DELETE /community/[communityId]/requests', function () {
      //fail to reject request if not member && not user
      // reject request
    });
    describe('GET /membership/[membershipId]/reject', function () {
      /*
       fail to reject request if not member
       reject request
       */
    });
    describe('GET /request/[requestId]/', function () {
      //   get request
      // failed to get request if not a member of the community or not the user
    });
    describe('POST /request/[requestId]/', function () {
      /*
       fail to update request if not user
       update request
       */
    });
    describe('DELETE /request/[requestId]/', function () {
      /*
       fail to delete request if not user
       delete request
       */
    });
  });
})();
