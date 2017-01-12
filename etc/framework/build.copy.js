;(function buildCopyEnclosure() {
  var fs = require('fs');

  var tools = require('./build.tools.js');

  //--------------------------------------------------------------------------------------------- js

  function buildCopy(config) {
    try {
      var files = tools.getFileList(config.source, {mask: config.source});

      files.forEach(function copyItem(item) {
        // if item is a file in compileSource, the index will be 1 due to the '/'
        if (item.indexOf('/.') !== 0 && item.indexOf(config.compileSource) !== 1) {
          tools.ensureFolderExistance(config.dest, item);

          fs.createReadStream(config.source + '/' + item)
            .pipe(fs.createWriteStream(config.dest + '/' + item));
        }
      });
    }
    catch (err) {
      console.log('failed to copy files:', err);
    }
  }

  //------------------------------------------------------------------------------------------------

  module.exports = buildCopy;
})();
