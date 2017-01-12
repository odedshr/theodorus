;(function buildTemplatesEnclosure() {
  var fs = require('fs');

  var tools = require('./build.tools.js');

  //--------------------------------------------------------------------------------------------- js

  function buildTemplates(config) {
    var templates = tools.getFileList(config.source + '/' +
                                      config.compileSource , {filter: /\.template.html/});
    var templateCount = templates.length;
    var accString = '';
    var contentPattern = new RegExp(/<body>((.|\n)*?)<\/body>/m);
    var template;
    var content;
    var file;

    while (templateCount--) {
      var fileName = templates[templateCount];

      file = fs.readFileSync(fileName, 'utf-8');
      content = file.match(contentPattern);
      if (content !== null) { // if template file includes templates -
        accString += content[1];        
      }
    }

    template = fs.readFileSync(config.source + '/' +
                               config.compileSource + '/' +
                               config.templateHtmlSourceFile, 'utf-8');
    content = template.replace('{{templates}}', accString);
    fs.writeFile(config.dest + '/' +
                 config.templatesFile, content, tools.onError);
  }

  //------------------------------------------------------------------------------------------------

  module.exports = buildTemplates;
})();
