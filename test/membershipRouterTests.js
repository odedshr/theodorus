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
    describe('GET /community/[communityId]/membership', function () {
      //get list of member
      // failed to get list of secret community
    });
    describe('PUT /community/[communityId]/membership', function () {
      /*
       fail to add member with existing name
       failed to add member with no name
       add a member, verify image exists
       */
    });
    describe('GET /community/[communityId]/quit', function () {
      //   remove a member
    });
    describe('GET /membership', function () {
      // get list of user
    });
    describe('GET /membership/[membershipId]/', function () {
      /*
       get member details as member's user
       get member detail as another user
       */
    });
    describe('POST /membership/[membershipId]/', function () {
      //fail to update member to existing name
    });
    describe('DELETE /membership/[membershipId]/', function () {
      /*
       fail to delete member if not user
       quit community
       */
    });
    describe('POST /membership/exists/', function () {
      /*
       check existing name
       check non-existing name
       empty string = already exists
      */
    });
  });
})();