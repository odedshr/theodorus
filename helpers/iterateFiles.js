(function iterateFilesEnclosure() {
  'use strict';

  var fs = require('fs');

  module.exports = function perFileInFolder (folder, perFile) {
    var files = fs.readdirSync (folder);
    while (files.length) {
      while (files.length) {
        perFile(require('.'+folder + '/' + files.pop()));
      }
    }
  };
})();