(function iterateFilesEnclosure() {
  'use strict';

  var fs = require('fs');
  var log = require('../helpers/logger.js');

  module.exports = function perFileInFolder(folder, perFile) {
    var files = fs.readdirSync(__dirname + '/' + folder);
    for (var i = 0, length = files.length; i < length; i++) {
      var file = files[i];
      try {
        perFile(require(__dirname + '/' + folder + '/' + file), file);
      }
      catch (err) {
        log('failed to load file ' + folder + '/' + file);
        log(err);
      }

    }
  };
})();
