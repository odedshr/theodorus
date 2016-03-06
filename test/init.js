(function () {
    'use strict';

    function runNextTest (tests) {
        if (tests.length) {
            var test = tests.pop();
            if (test.indexOf('.test.js') > -1) {
                console.log('\x1b[40m\x1b[37m - ' + test.replace('.test.js', '')+' \x1b[0m');
                require('./' + test).suite(webdriver, browser, runNextTest.bind(this, tests));
            } else {
                runNextTest(tests);
            }
        } else {
            browser.quit();
            console.log('\x1b[40m\x1b[37m test completed.\x1b[0m');
        }
    }

    var fs = require ('fs');
    var chromedriver = require('chromedriver');
    var webdriver = require('selenium-webdriver');
    var browser = new webdriver.Builder().usingServer().withCapabilities({'browserName': 'chrome' }).build();
    runNextTest(fs.readdirSync('.'));

})();