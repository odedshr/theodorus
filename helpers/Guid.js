;(function guidClosure() {

  var defaultLength = 2;

  function guid (length) {
    if (length === undefined) {
      length =  defaultLength;
    }
    var parts = [];
    while (length--) {
      parts[length] = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return parts.join('-');
  }

  module.exports = guid;
})();