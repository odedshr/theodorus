(function modelUtilsEnclosure() {
  function toList (list) {
    var items = [];
    var i, listLength = list.length;
    for ( i = 0; i < listLength; i++) {
      items.push(list[i].toJSON());
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
      map[item[indexedBy]] = item.toJSON();
    }
    return  map;
  }

  exports.toList = toList;
  exports.toMap = toMap;
})();