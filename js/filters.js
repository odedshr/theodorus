app = (typeof app !== 'undefined') ? app : {};
(function filtersEnclosure() {

  this.getFilteredItems = getFilteredItems;
  function getFilteredItems (items, filters) {
    if (Object.keys(filters).length > 0) {
      var filtered = [];
      var count = items.length;
      for (var i =0; i < count; i++) {
        var item = sift(this.clone(items[i]), filters);
        if (item) {
          filtered[filtered.length] = item;
        }
      }
      return filtered;
    } else {
      return items;
    }
  }

  function sift (item, filters) {
    var keys = Object.keys(filters);
    while (keys.length) {
      var key = keys.pop();
      var value = filters[key];
      if (item[key].indexOf(value) > -1) {
        item[key] = item[key].replace(value, O.TPL.render({'selectedText':{text:value}}));
      } else {
        return false;
      }
    }
    return item;
  }

return this;}).call(app);
