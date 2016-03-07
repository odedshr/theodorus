(function tryCatchEnclosure() {
    'use strict';
    var log = require('../helpers/logger.js');

    module.exports = function tryCatch (func,callback) {
        try {
            func();
        } catch (err) {
            log(err, 'fatal');
            if (typeof callback === 'function') {
                callback(err);
            }
        }
    };
})();