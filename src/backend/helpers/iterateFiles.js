(function iterateFilesEnclosure() {
  'use strict';

  var fs = require('fs'),
      log = require('../helpers/logger.js');

  module.exports = function perFileInFolder(folder, perFile) {
    fs.readdirSync(__dirname + '/' + folder).forEach(function perItem(file) {
      try {
        if (file.indexOf('.') !== 0) { // avoid loading .DS_Store
          perFile(require(__dirname + '/' + folder + '/' + file), file);
        }
      }
      catch (err) {
        log('failed to load file ' + folder + '/' + file);
        log(err);
      }
    });
  };
})();
