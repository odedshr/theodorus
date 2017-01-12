(function ErrorsEnclosure () {
  'use strict';

  function DetailedError (message, status, details, stack) {
    this.message = message;
    this.stack = stack;
    this.status = status;
    this.details = details;
  }

  DetailedError.prototype = Object.create(Error.prototype);
  DetailedError.prototype.constructor = DetailedError;

  function systemError (err, args, url) {
    var error =  new DetailedError ('system-error', 500, {
      args: args,
      url: url
    }, err);
    return error;
  }

  function unauthorized () {
    return new DetailedError ('unauthorized',401);
  }
  function notFound (type,id) {
    return new DetailedError ('not-found', 404, {key: type, value: id});
  }

  function noPermissions (actionName) {
    return new DetailedError ('no-permissions',401,{action: actionName});
  }

  function badInput (key, value) {
    return new DetailedError ('bad-input', 406, {key: key, value: value});
  }

  function tooLong (varName, value) {
    return new DetailedError ('too-long',406, {key: varName, value: value});
  }

  function tooShort (varName, value) {
    return new DetailedError ('too-short',406, {key: varName, value: value});
  }

  function immutable (varType) {
    return new DetailedError ('immutable', 406, {key: varType});
  }

  function alreadyExists (varType, value) {
    return new DetailedError ('already-exists', 409, {key: varType, value: value});
  }

  function missingInput (varName) {
    return new DetailedError ('missing-input',406, {key: varName});
  }

  function expired (varName) {
    return new DetailedError ('expired',406, {key: varName});
  }
  function saveFailed (varName, content, error) {
    return new DetailedError ('save-failed', 500, {key: varName, value: content}, error);
  }

  module.exports = {
    unauthorized : unauthorized,
    notFound : notFound,
    noPermissions : noPermissions,
    badInput : badInput,
    tooLong : tooLong,
    tooShort : tooShort,
    immutable : immutable,
    alreadyExists : alreadyExists,
    missingInput :  missingInput,
    expired :  expired,
    saveFailed :  saveFailed,
    systemError :  systemError,
    DetailedError : DetailedError
  };
})();
