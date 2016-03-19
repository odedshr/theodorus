(function userTestSuite () {
  'use strict';

  var testUtils = require ('./testUtils.js');
  var fs = require ('fs');
  var assert = testUtils.assert;
  var browser = testUtils.browser();
  var webdriver = testUtils.webdriver;

  describe('TopicTests', function () {
     var email = 'browser.topic@test.suite.tst';

     before (function beforeAllTests(done) {
       console.log('before');
        testUtils.connect (browser, email, done);
     });

     after (function afterAllTests() {
       console.log('after');
       //browser.quit();
     });

     describe('Add Topic', function addItem() {
       it('should successfully add a community', function addItemSuccess (done) {
         browser.get(testUtils.url);
         var elm = browser.findElement(webdriver.By.css('a'));
         assert.ok (elm.isDisplayed(),'join button appears');
         done();
       });
     });

     describe('List Topics', function listItems () {
       it('should successfully list items', function listItemsSuccess (done) {
         done();
       });
     });

     describe('Update Topic', function updateItem () {
       it('should successfully update a item', function updateItemSuccess (done) {
         done();
       });
     });

     describe('Remove Topic', function archiveItem () {
       it('should successfully archive a item', function archiveItemSuccess (done) {
         done();
       });
     });
   });


})();
