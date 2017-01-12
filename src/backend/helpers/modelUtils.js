(function modelUtilsEnclosure() {
  'use strict';

  function toJSON (item, fields) {
    var output = {};
    for (var i = 0, length = fields.length; i < length; i++) {
      var key = fields[i];
      output[key] = item[key];
    }
    return output;
  }

  function simplyReturn (value) {
    return value;
  }

  function toList (list, jsonFunction) {
    var length = list.length;
    var items = new Array(length);

    if (jsonFunction === undefined) {
      jsonFunction = 'toJSON';
    }

    for (var i = 0; i < length; i++) {
      items[i] = list[i][jsonFunction]();
    }
    return items;
  }

  function toMap (list, indexedBy) {
    if (indexedBy === undefined) {
      indexedBy = 'id';
    }
    var map = {};
    for (var i = 0, length = list ? list.length : 0; i < length; i++) {
      var item = list[i];
      map[item[indexedBy]] = item;
    }
    return  map;
  }

  function toVector (list, indexedBy) {
    if (indexedBy === undefined) {
      indexedBy = 'id';
    }
    var map = {};
    for (var i = 0, length = list ? list.length : 0; i < length; i++) {
      map[list[i][indexedBy]] = true;
    }
    return Object.keys(map);
  }

  function toEnum (array) {
    var map = {};
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      map[value] = value;
    }
    return map;
  }

  exports.toList = toList;
  exports.toMap = toMap;
  exports.toVector = toVector;
  exports.toJSON = toJSON;
  exports.simplyReturn = simplyReturn;
  exports.toEnum = toEnum;
})();