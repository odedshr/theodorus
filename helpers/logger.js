;(function loggerEnclosure() {
    'use strict';

    module.exports = function logger(string, level) {
        console.log((typeof level === undefined ? '': (level + ': ')) + string);
    }
})();