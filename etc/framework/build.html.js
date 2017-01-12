;(function buildHTMLEnclosure() {
  var fs = require('fs');

  var TPL = require('../../src/webapp/vendor/o.min.js').TPL;
  var tools = require('./build.tools.js');

  //--------------------------------------------------------------------------------------------- js

  function buildHTML(config) {
    var indexHTML = fs.readFileSync(config.source + '/' +
                                    config.compileSource + '/' +
                                    config.indexHtmlSourceFile, 'utf-8');
    var data = config.isProduction ? {
        stylesheets: [config.minifiedCssFile],
        scripts: [config.combinedJsFile],
        environment: 'debug',
        server: config.debugServer,
        buildId: config.buildId,
        isDebug: true,
      } : {
          stylesheets: [config.combinedCssFile],
          scripts: tools.getFileList(config.source + '/' +
                                     config.compileSource,
                                    {mask: config.source, filter: /\.js$/}),
          environment: 'prod',
          server: config.productionServer,
          buildId: config.buildId,
          isDebug: false,
        };
    TPL.loadLanguage('../i18n/en-us.json');

    rendered = TPL.render(indexHTML, data);
    fs.writeFile(config.dest + '/index.html', rendered, tools.onError);
  }

  //------------------------------------------------------------------------------------------------

  module.exports = buildHTML;
})();
