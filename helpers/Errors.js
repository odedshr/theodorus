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
        var error = new DetailedError (type+'-not-found');
        error.value = {key: type, value: id};
        error.status = 404;
        return error;
    }

    function noPermissions (actionName) {
        var error = new DetailedError ('no-permissions-to-'+actionName);
        error.status = 401;
        return error;
    }

    function badInput (key, value) {
        var error = new DetailedError ('bad-input-'+key);
        error.value = {key: key, value: value};;
        error.status = 406;
        return error;
    }

    function tooLong (varName) {
        return new DetailedError (varName+'-too-long');
    }

    function immutable (varType) {
        return new DetailedError ('immutable-' + varType);
    }

    function alreadyExists (varType) {
        var error = new DetailedError ('already-exists-' + varType);
        error.status = 409;
        return error;
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
