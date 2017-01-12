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
    describe('GET /[subjectType]/[subjectId]/read', function () {});
    describe('DELETE /[subjectType]/[subjectId]/read', function () {});
    describe('GET /[subjectType]/[subjectId]/unread', function () {});
    describe('DELETE /[subjectType]/[subjectId]/unread', function () {});
    describe('GET /[subjectType]/[subjectId]/follow', function () {});
    describe('DELETE /[subjectType]/[subjectId]/follow', function () {});
    describe('GET /[subjectType]/[subjectId]/unfollow', function () {});
    describe('DELETE /[subjectType]/[subjectId]/unfollow', function () {});
    describe('GET /[subjectType]/[subjectId]/endorse', function () {});
    describe('DELETE /[subjectType]/[subjectId]/endorse', function () {});
    describe('GET /[subjectType]/[subjectId]/unendorse', function () {});
    describe('DELETE /[subjectType]/[subjectId]/unendorse', function () {});
    describe('GET /[subjectType]/[subjectId]/report', function () {});
    describe('DELETE /[subjectType]/[subjectId]/report', function () {});
  });
})();
