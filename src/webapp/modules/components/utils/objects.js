/* global appName */
;(function objectsEnclosure(scope) {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function clone(object) {
    return JSON.parse(JSON.stringify(object));
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function extend(obj, src) {
    var key;

    for (key in src) {
      if (src.hasOwnProperty(key)) {
        obj[key] = src[key];
      }
    }

    return obj;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function obtain(key, value, obtainMethod, callback) {
    switch (typeof value) {
      case 'undefined':
        throw scope.error.missingInput(key);
      case 'string':
        obtainMethod(function(data) {
          callback(data[key]);
        });
        break;
      case 'object':
        callback(value);
        break;
      default:
        throw scope.error.badInput(key, value);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function pick(item, fields) {
    var output = {};

    fields.forEach(function perField(field) {
      output[field] = item[field];
    });

    return output;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function Objects() {}

  Objects.prototype = {
    clone: clone,
    extend: extend,
    obtain: obtain,
    pick: pick
  };

  scope.objects = new Objects();
})(window[appName] || module.exports);
