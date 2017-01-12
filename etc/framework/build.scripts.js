;(function buildScriptsEnclosure() {
  var fs = require('fs');
  var UglifyJS = require('uglify-js'); //https://www.npmjs.com/package/uglify-js

  var tools = require('./build.tools.js');

  //--------------------------------------------------------------------------------------------- js

  function buildScripts(config) {
    var compileSrcFullPath = config.source + '/' + config.compileSource;
    var initJsFileFullPath = compileSrcFullPath + '\/' + config.initJsFile;
    var reAllJSExceptAppLoader = new RegExp('^(?!' + initJsFileFullPath +').*\\.js$');
    var files = tools.getFileList(compileSrcFullPath,
                                  {filter: reAllJSExceptAppLoader });

    // config.initJsFile is the name of the js file that should be loaded before
    // all other modules. Name includes only filename with no extension.
    if (fs.existsSync(initJsFileFullPath + '.js')) {
      files.unshift (initJsFileFullPath + '.js');
    }

    if (config.mode==='dev') {
      copyFiles(config, files);
    } else {
      uglifyFiles(config, files);
    }
  }

  function copyFiles(config, files) {
    files.forEach(function copyItem(item) {
      var target = item.replace(config.source,'');
      tools.ensureFolderExistance(config.dest, target);
      fs.createReadStream(item)
        .pipe(fs.createWriteStream(config.dest + target));
    });
  }
  function uglifyFiles (config, files) {
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
