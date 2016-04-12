(function iterateFilesEnclosure() {
  'use strict';

  var fs = require('fs');
  var log = require('../helpers/logger.js');

  module.exports = function perFileInFolder (folder, perFile) {
    var files = fs.readdirSync (folder);
    while (files.length) {
      var file = files.pop();
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