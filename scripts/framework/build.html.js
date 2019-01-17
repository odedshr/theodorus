// cSpell:words minified, webapp
;(function buildHTMLEnclosure() {
  'use strict';
  var fs = require('fs'),
      TPL = require('../../src/webapp/vendor/o.min.js').TPL,
      tools = require('./build.tools.js');

  //--------------------------------------------------------------------------------------------- js

  function buildHTML(config) {
    var indexHTML = fs.readFileSync(config.source + '/' +
                                    config.compileSource + '/' +
                                    config.indexHtmlSourceFile, 'utf-8'),
        data = { buildId: config.buildId },
        rendered;

    if (config.isProduction) {
      data.stylesheets = [config.minifiedCssFile];
      data.scripts = [config.combinedJsFile];
      data.environment = 'debug';
      data.server = config.debugServer;
      data.isDebug = true;
    }  else {
      data.stylesheets = [config.combinedCssFile];
      data.scripts = tools.getScriptFileList(config, config.source);
      data.environment = 'prod';
      data.server = config.productionServer;
      data.isDebug = false;
    }

    TPL.loadLanguage('../i18n/en-us.json');

    rendered = TPL.render(indexHTML, data);
    fs.writeFile(config.dest + '/index.html', rendered, tools.onError);
  }

  //------------------------------------------------------------------------------------------------

  module.exports = buildHTML;
})();
