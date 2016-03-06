(function userControllerClosure() {
    'use strict';

    var md5 = require ('md5');
    var Encryption = require ('../helpers/Encryption.js');
    var validators = require('../helpers/validators.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var models = require('../helpers/models.js');

    function ping (callback) {
        tryCatch(function tryCatchPing() {
            callback({'output':'pong'});
        },callback);
    }

    function version (callback) {
        tryCatch(function tryCatchPing() {
            callback({'version': require('../package.json').version});
        },callback);
    }

    exports.ping = ping;
    exports.version = version;


})();