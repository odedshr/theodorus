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

  function filter(list, criteria) {
    var matches = [];

    list.forEach(function perItem(item) {
      var match = true,
          key;

      for (key in criteria) {
        match = match && (item[key]) !== criteria[key];
      }

      if (match) {
        matches.push(item);
      }
    });

    return matches;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function Objects() {}

  Objects.prototype = {
    clone: clone,
    extend: extend,
    obtain: obtain,
    pick: pick,
    filter: filter
  };

  scope.objects = new Objects();
})(window[appName] || module.exports);
