;(function guidClosure() {

  var defaultLength = 2;

  function guid (length) {
    if (length === undefined) {
      length =  defaultLength;
    }
    for (var i = 0, parts = []; i < length; i++) {
      parts.push(Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1));
    }
    return parts.join('-');
  }

  module.exports = guid;
})();