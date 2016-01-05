(function ErrorsEnclosure () {
    'use strict';

    function DetailedError (message, stack) {
        this.message = message;
        this.stack = stack;
    }

    DetailedError.prototype = Object.create(Error.prototype);
    DetailedError.prototype.constructor = DetailedError;

    function notFound () {
        return new DetailedError (404);
    }

    function noPermissions (actionName) {
        return new DetailedError ('no-permissions-to-'+actionName);
    }

    function badInput (description) {
        return new DetailedError (description);
    }

    function tooLong (varName) {
        return new DetailedError (varName+'-too-long');
    }

    function immutable (varType) {
        return new DetailedError ('immutable-' + varType);
    }

    module.exports.notFound = notFound;
    module.exports.noPermissions = noPermissions;
    module.exports.badInput = badInput;
    module.exports.tooLong = tooLong;
    module.exports.immutable = immutable;
})();
