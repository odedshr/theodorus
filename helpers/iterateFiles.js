(function iterateFilesEnclosure() {
  'use strict';

  var fs = require('fs');
  var log = require('../helpers/logger.js');

  module.exports = function perFileInFolder (folder, perFile) {
    var files = fs.readdirSync (folder);
    for (var i = 0, length = files.length; i < length; i++) {
      var file = files[i];
      try {
        perFile(require('.'+folder + '/' + file), file);
      }
      catch (err) {
        log ('failed to load file ' + folder + '/' + file );
        log (err);
      }

    }
  };
})();