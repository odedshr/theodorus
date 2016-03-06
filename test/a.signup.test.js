(function () {
    'use strict';

    function testSignUp (webdriver, browser, callback) {
        var chai = require('chai');
        chai.use(require('chai-as-promised'));
        var expect = chai.expect;

        browser.get('http://localhost:8080/');
        browser.findElement(webdriver.By.css('.nav-link.link-sign-up')).click();
        browser.findElement(webdriver.By.css('[data-register="btnSignUp"]')).click();
        callback();
    }

    module.exports.suite = testSignUp;
})();