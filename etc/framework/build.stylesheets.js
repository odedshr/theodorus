;(function buildStylesheetsEnclosure() {
  var fs = require('fs');
  var less = require('less');
  var UglifyJS = require('uglify-js'); //https://www.npmjs.com/package/uglify-js

  var tools = require('./build.tools.js');

  //-------------------------------------------------------------------------------------------- css

  function buildStylesheets(config) {
    var files = tools.getFileList(config.source + '/' +
                                  config.compileSource, {filter: /\.less$/});
    var fileCount = files.length;
    var css = [];
    var minified = [];
    var target;

    files.forEach(function perFile(fileName) {
      var lessContent = fs.readFileSync(fileName, 'utf-8');
      // Specify a filename, for better error messages
      less.render(lessContent,
        {filename: fileName.replace('.less', '.min.less'), compress: true,},
        onRendered.bind({}, config.dest + '/' + config.minifiedCssFile,
                        minified,
                        fileCount));

      less.render(lessContent,
        {filename: fileName, compress: false,},
        onRendered.bind({}, config.dest + '/' + config.combinedCssFile,
                        css,
                        fileCount));
    });
  }

  function onRendered(target, outputs, fileCount, err, output) {
    if (err) {
      console.log('failed to render stylesheet ' + target);
      console.log(err);
    } else {
      outputs.push(output.css);
    }

    if (outputs.length === fileCount) {
      fs.writeFileSync(target, outputs.join(''), 'utf8');
    }
  }

  module.exports = buildStylesheets;
})();
