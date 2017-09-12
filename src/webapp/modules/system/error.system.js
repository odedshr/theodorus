/* global appName */
;(function errorSystemEnclosure(scope) {
  'use strict';

  function DetailedError(message, status, details, stack) {
    this.message = message;
    this.stack = stack;
    this.status = status;
    this.details = details;
  }

  DetailedError.prototype = Object.create(Error.prototype);
  DetailedError.prototype.constructor = DetailedError;

  function Error() {}

  Error.prototype = {
    customError: DetailedError,

    isError: function isError(object) {
      return (object instanceof DetailedError);
    },

    systemError: function systemError(err, args, url) {
      var error =  new DetailedError('system-error', 500, {
        args: args,
        url: url
      }, err);

      return error;
    },

    unauthorized: function unauthorized() {
      return new DetailedError('unauthorized', 401);
    },

    notFound: function notFound(type, id) {
      return new DetailedError('not-found', 404, { key: type, value: id });
    },

    noPermissions: function noPermissions(actionName) {
      return new DetailedError('no-permissions', 401, { action: actionName });
    },

    badInput: function badInput(key, value) {
      return new DetailedError('bad-input', 406, { key: key, value: value });
    },

    tooLong: function tooLong(varName, value) {
      return new DetailedError('too-long', 406, { key: varName, value: value });
    },

    tooShort: function tooShort(varName, value) {
      return new DetailedError('too-short', 406, { key: varName, value: value });
    },

    immutable: function immutable(varType) {
      return new DetailedError('immutable', 406, { key: varType });
    },

    alreadyExists: function alreadyExists(varType, value) {
      return new DetailedError('already-exists', 409, { key: varType, value: value });
    },

    missingInput: function missingInput(varName) {
      return new DetailedError('missing-input', 406, { key: varName });
    },

    expired: function expired(varName) {
      return new DetailedError('expired', 406, { key: varName });
    },

    operationFailed: function operationFailed(varName, content, error) {
      return new DetailedError('operation-failed', 500, { key: varName, value: content }, error);
    }
  };

  scope.error = new Error();
})(window[appName] || module.exports);
