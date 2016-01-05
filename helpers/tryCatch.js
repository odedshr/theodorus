(function tryCatchEnclosure() {
    'use strict';
    var log = require('../helpers/logger.js');

    module.exports = function tryCatch (func,callback) {
        try {
            func();
        } catch (err) {
            var stack = JSON.stringify(err.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                .split('\n'),null,4);
            log(err.message + ':' + stack, 'fatal');
            if (typeof callback === 'function') {
                callback(err);
            }
        }
    };
})();