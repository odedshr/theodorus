;(function errorEnclosure(scope) {
  'use strict';

  function ERROR () {}
  //ERROR is our container class. We'll add the interface to its prototype

  //////////////////////////////////////////////////////////////////////////////////////////////////\

  function systemError (err, args, url) {
    var error =  new O.DetailedError ('system-error', 500, {
      args: args,
      url: url
    }, err);
    return error;
  }

  function unauthorized () {
    return new O.DetailedError ('unauthorized',401);
  }
  function notFound (type,id) {
    return new O.DetailedError ('not-found', 404, {key: type, value: id});
  }

  function noPermissions (actionName) {
    return new O.DetailedError ('no-permissions',401,{action: actionName});
  }

  function badInput (key, value) {
    return new O.DetailedError ('bad-input', 406, {key: key, value: value});
  }

  function tooLong (varName, value) {
    return new O.DetailedError ('too-long',406, {key: varName, value: value});
  }

  function tooShort (varName, value) {
    return new O.DetailedError ('too-short',406, {key: varName, value: value});
  }

  function immutable (varType) {
    return new O.DetailedError ('immutable', 406, {key: varType});
  }

  function alreadyExists (varType, value) {
    return new O.DetailedError ('already-exists', 409, {key: varType, value: value});
  }

  function missingInput (varName) {
    return new O.DetailedError ('missing-input',406, {key: varName});
  }

  function expired (varName) {
    return new O.DetailedError ('expired',406, {key: varName});
  }
  function saveFailed (varName, content, error) {
    return new O.DetailedError ('save-failed', 500, {key: varName, value: content}, error);
  }

  ERROR.prototype.unauthorized = unauthorized;
  ERROR.prototype.notFound = notFound;
  ERROR.prototype.noPermissions = noPermissions;
  ERROR.prototype.badInput = badInput;
  ERROR.prototype.tooLong = tooLong;
  ERROR.prototype.tooShort = tooShort;
  ERROR.prototype.immutable = immutable;
  ERROR.prototype.alreadyExists = alreadyExists;
  ERROR.prototype.missingInput =  missingInput;
  ERROR.prototype.expired =  expired;
  ERROR.prototype.saveFailed =  saveFailed;
  ERROR.prototype.systemError =  systemError;
  ERROR.prototype.DetailedError = O.DetailedError;

  //////////////////////////////////////////////////////////////////////////////////////////////////

  scope.error = new ERROR();
})(theodorus);
