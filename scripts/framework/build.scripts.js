;(function buildScriptsEnclosure() {
  'use strict';

  var fs = require('fs'),
      UglifyJS = require('uglify-js'), //https://www.npmjs.com/package/uglify-js
      tools = require('./build.tools.js');

  //--------------------------------------------------------------------------------------------- js

  function buildScripts(config) {
    var files = tools.getScriptFileList(config);

    if (config.mode === 'dev') {
      copyFiles(config, files);
    } else {
      uglifyFiles(config, files);
    }
  }

  function copyFiles(config, files) {
    files.forEach(function copyItem(item) {
      var target = item.replace(config.source, '');

      tools.ensureFolderExistence(config.dest + tools.getFolderOfFile(target));
      fs.createReadStream(item)
        .pipe(fs.createWriteStream(config.dest + target));
    });
  }

  function uglifyFiles(config, files) {
    try {
      fs.writeFileSync(config.dest + '/' + config.combinedJsFile,
                       UglifyJS.minify(files).code, 'utf8');
    }
    catch (err) {
      console.log('failed to uglify:', err);
    }
  }

  //------------------------------------------------------------------------------------------------

  module.exports = buildScripts;
})();
