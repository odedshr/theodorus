(function ErrorsEnclosure () {
    'use strict';

    function DetailedError (message, stack) {
        this.message = message;
        this.stack = stack;
    }

    DetailedError.prototype = Object.create(Error.prototype);
    DetailedError.prototype.constructor = DetailedError;

    function unauthorized () {
        return new DetailedError (401);
    }
    function notFound (type,id) {
        var error = new DetailedError (404);
        error.value = {key: type, value: id};
        return error;
    }

    function noPermissions (actionName) {
        return new DetailedError ('no-permissions-to-'+actionName);
    }

    function badInput (key, value) {
        var error = new DetailedError (key);
        error.value = value;
        return error;
    }

    function tooLong (varName) {
        return new DetailedError (varName+'-too-long');
    }

    function immutable (varType) {
        return new DetailedError ('immutable-' + varType);
    }

    function alreadyExists (varType) {
        return new DetailedError ('already-exists-' + varType);
    }

    function missingInput (varName) {
        return new DetailedError (varName+'-too-long');
    }

    module.exports.unauthorized = unauthorized;
    module.exports.notFound = notFound;
    module.exports.noPermissions = noPermissions;
    module.exports.badInput = badInput;
    module.exports.tooLong = tooLong;
    module.exports.immutable = immutable;
    module.exports.alreadyExists = alreadyExists;
    module.exports.missingInput =  missingInput;
})();
