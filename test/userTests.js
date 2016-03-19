(function userTestSuite () {
  'use strict';

  var testUtils = require ('./testUtils.js');
  var fs = require ('fs');
  var assert = testUtils.assert;
  var browser = testUtils.browser();
  var webdriver = testUtils.webdriver;

  describe('UserTests', function () {
     var email = 'browser.user@test.suite.tst';
     var tokenFile = '../theodorus/user-files/debug_'+email+'.json';
     var token ='';

     if (true) {
       return;
     }

     after(function afterAllTests() {
       if (fs.existsSync(tokenFile)) {
          fs.unlinkSync(tokenFile);
       }
       browser.quit();
     });

     describe('POST /user/connect', function postUserConnect() {
       it('should successfully request authentication token', function (done) {
         browser.get(testUtils.url);
         var field = browser.findElement(webdriver.By.css('#joinEmail'));
         field.click();
         field.sendKeys(email);
         browser.findElement(webdriver.By.css('[data-register="frmJoin"] button')).click();
         browser.wait(webdriver.until.elementLocated(webdriver.By.css('.notification.system')), 4000).then(function(elm) {
           elm.getText().then(function (value) {
             assert.equal (value,'Check your mailbox for a message from Theodorus (bot@minsara.co.il) with your connection link','confirmation as expected');
             assert.ok (fs.existsSync(tokenFile),'token file created');
             //browser.close();
             //browser = testUtils.browser();
             browser.get(testUtils.url+'#user/connect:'+require('../' + tokenFile).token);
             browser.navigate().refresh();
             browser.wait(webdriver.until.elementLocated(webdriver.By.css('a.nav-link.link-me')), 4000).then(function(elm) {
               assert.ok (elm.isDisplayed(),'a \'me\' button is displayed');
               done();
             });
           });
         });
       }).timeout(5000);
     });
   });


})();
