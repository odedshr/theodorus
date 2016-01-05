;(function EncryptionClosure() {
    'use strict';

    var jwtSimple = require ('jwt-simple');
    var config = require('../helpers/config.js');
    var key = JSON.stringify(process.argv) + ((config('environment') === 'prod') ? process.pid : '');
    var maskKey = (key.length * 10);

    exports.encode = function encode (string) {
        return jwtSimple.encode(string, key);
    };

    exports.decode = function decode (encryptedString) {
        return jwtSimple.decode(encryptedString, key);
    };

    exports.mask = function encode (number) {
        return (number + maskKey).toString(16);
    };

    exports.unmask = function decode (encryptedNumber) {
        return parseInt(encryptedNumber, 16) - maskKey;
    };
})();