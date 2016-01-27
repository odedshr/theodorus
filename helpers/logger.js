;(function loggerEnclosure() {
    'use strict';

    function logger (string, level) {
        console.log ((level === undefined ? '': (level + ': ')) + string);
    }

    module.exports = logger;
})();