/* global appName */
;(function validationsEnclosure(scope) {
  'use strict';

  function Validations() {}

  Validations.prototype = {
    email: function validateEmail(value) {
      return (value && value.match(scope.pattern.email) !== null);
    },

    id: function validateId(value) {
      return (value && value.match(scope.pattern.maskedId) !== null);
    },

    int: function validateInt(value) {
      return Number.isInteger(value);
    },

    number: function validateNumber(value) {
      return !Number.isNaN(value);
    },

    range: function range(value, limits) {
      var min, max, isPositive;

      if (typeof limits === 'object') {
        min = limits.min;
        max = limits.max;
        isPositive = arguments[2];
      } else {
        min = limits;
        max = arguments[2];
        isPositive = arguments[3];
      }

      return !Number.isNaN(value) &&
              ((isPositive && min < 0) || (min <= value)) &&
              ((isPositive && max < 0) || (value <= max));
    },

    string: function validateString(value) {
      return (typeof value === 'string');
    }
  };

  scope.validate = new Validations();

})(window[appName] || module.exports);
