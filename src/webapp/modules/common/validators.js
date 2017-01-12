;(function logEnclosure(scope) {
  'use strict';

  function VALIDATORS() {}

  var emailPatternString = '((([^<>()[\\]\\\\.,;:\\s@\\"]+(\\.[^<>()[\\]\\\\.,;:\\s@\\"]+)*)|(\\".+\\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,})))';

  VALIDATORS.prototype.email = function validateEmail(value) {
    return (value.match(emailPatternString) !== null);
  };

  VALIDATORS.prototype.id = function validateId(value) {
    return (typeof value === 'string');
  };

  VALIDATORS.prototype.int = function validateInt(value) {
    return Number.isInteger(value);
  };

  VALIDATORS.prototype.number = function validateNumber(number) {
    return !Number.isNaN(value);
  };

  VALIDATORS.prototype.string = function validateString(value) {
    return (typeof value === 'string');
  };

  scope.validate = new VALIDATORS();

})(theodorus);
