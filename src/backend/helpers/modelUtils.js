(function modelUtilsEnclosure() {
  'use strict';

  function toJSON(item, fields) {
    var output = {};

    fields.forEach(function perField(field) {
      output[field] = item[field];
    });

    return output;
  }

  function simplyReturn(value) {
    return value;
  }

  function toList(list, jsonFunction) {
    var items = [];

    if (jsonFunction === undefined) {
      jsonFunction = 'toJSON';
    }

    list.forEach(function perItem(item) {
      if (typeof item[jsonFunction] === 'function') {
        items.push(item[jsonFunction]());
      } else {
        items.push(item);
      }
    });

    return items;
  }

  function toMap(list, indexedBy) {
    var map = {};

    if (indexedBy === undefined) {
      indexedBy = 'id';
    }

    list.forEach(function perItem(item) {
      map[item[indexedBy]] = item;
    });

    return map;
  }

  function toVector(list, indexedBy) {
    var map = {};

    if (indexedBy === undefined) {
      indexedBy = 'id';
    }

    list.forEach(function perItem(item) {
      map[item[indexedBy]] = true;
    });

    return Object.keys(map);
  }

  function toEnum(strings) {
    var map = {};

    strings.forEach(function perItem(item) {
      map[item] = item;
    });

    return map;
  }

  exports.toList = toList;
  exports.toMap = toMap;
  exports.toVector = toVector;
  exports.toJSON = toJSON;
  exports.simplyReturn = simplyReturn;
  exports.toEnum = toEnum;
})();
