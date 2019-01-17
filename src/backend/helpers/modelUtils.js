export default {
  toJSON(item, fields) {
    return fields.reduce((memo, field) => {
      memo[field] = item[field];
      return memo;
    }, {});
  },

  simplyReturn(value) {
    return value;
  },

  toList(list, jsonFunction = 'toJSON') {
    return list.map(item => (
      typeof item[jsonFunction] === 'function' ?
      item[jsonFunction]() :
      item
    ));
  },

  toMap(list, indexedBy = 'id') {
    return list.reduce((memo, item) => {
      memo[item[indexedBy]] = item;
      return memo;
    }, {});
  },

  toVector(list, indexedBy = 'id') {
    return list.map(item => item[indexedBy]);
  },

  toEnum(stringArray) {
    return stringArray.reduce((memo, string) => {
      memo[string] = string;
      return memo;
    }, {});
  },

  filterFieldsBy(schema, filterByFunc) {
    Object.keys(schema).reduce((memo, key) => {
      if (filterByFunc(schema[key])) {
        memo.push(key);
      }
      return memo;
    }, [])
  }
}