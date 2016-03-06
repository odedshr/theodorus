(function () {
    'use strict';

    function testWikipedia (webdriver, browser, callback) {

        var skip = true;

        if (skip) {
            callback();
        } else {
            browser.get('http://en.wikipedia.org/wiki/Wiki');
            browser.findElements(webdriver.By.css('[href^="/wiki/"]')).then(function (links) {
                console.log('Found', links.length, 'Wiki links.');

                callback();
            });
        }
    }

    module.exports.suite = testWikipedia;
})();