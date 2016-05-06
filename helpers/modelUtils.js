(function modelUtilsEnclosure() {
  'use strict';

  function toJSON (item, fields) {
    var output = {};
    var count = fields.length;
    while (count--) {
      var key = fields[count];
      output[key] = item[key];
    }
    return output;
  }

  function simplyReturn (value) {
    return value;
  }

  function toList (list, jsonFunction) {
    var items = [];
    var listLength = list.length;

    if (jsonFunction === undefined) {
      jsonFunction = 'toJSON';
    }

    while (listLength--) {
      items[listLength] = list[listLength][jsonFunction]();
    }
    return items;
  }

  function toMap (list, indexedBy) {
    if (indexedBy === undefined) {
      indexedBy = 'id';
    }
    var count = list.length;
    var map = {};
    while (count--) {
      var item = list[count];
      map[item[indexedBy]] = item;
    }
    return  map;
  }

  exports.toList = toList;
  exports.toMap = toMap;
  exports.toJSON = toJSON;
  exports.simplyReturn = simplyReturn;
})();