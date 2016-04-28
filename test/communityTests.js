(function userTestSuite () {
  'use strict';

  var testUtils = require ('./testUtils.js');
  var fs = require ('fs');
  var assert = testUtils.assert;
  var browser = testUtils.browser();
  var webdriver = testUtils.webdriver;

  describe('UserTests', function () {
     var email = 'browser.community@test.suite.tst';
     var tokenFile = '../theodorus/user-files/debug_'+email+'.json';
     var token ='';

     if (true) {
       return;
     }
     after(function afterAllTests() {
       browser.quit();
     });

     describe('Add Community', function addCommunity() {
       it('should successfully add a community', function addCommunitySuccess (done) {
         done();
       });
     });

     describe('Update Community', function updateCommunity() {
       it('should successfully update a community', function updateCommunitySuccess (done) {
         done();
       });
     });

     describe('Quit Community', function quitCommunity() {
       it('should successfully quit a community', function quitCommunitySuccess (done) {
         done();
       });
     });

     describe('Join Community', function joinCommunity () {
       it('should successfully join a community', function joinCommunitySuccess (done) {
         done();
       });
     });
   });


})();
