function forEach (object, callback) {
  for (var key in object) {
    if (object.hasOwnProperty(key)) callback(key, object[key]);
  }
};

export default forEach;