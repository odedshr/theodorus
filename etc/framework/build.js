;(function buildEnclosure() {
  var buildCopy = require('./build.copy.js');
  var buildStylesheets = require('./build.stylesheets.js');
  var buildScripts = require('./build.scripts.js');
  var buildTemplates = require('./build.templates.js');
  var buildHTML = require('./build.html.js');
  var tools = require('./build.tools.js');

  //------------------------------------------------------------------------------------------------
  function build(config) {
    if (config.mode === 'false' ||
        (config.mode === 'auto' && !tools.isFolderExists(config.dest))) {
      return;
    } else {
      tools.execAndLogMethod(tools.ensureEmptyFolder.bind({}, config.dest));
      tools.execAndLogMethod(buildCopy.bind({}, config));
      tools.execAndLogMethod(buildStylesheets.bind({}, config));
      tools.execAndLogMethod(buildScripts.bind({}, config));
      tools.execAndLogMethod(buildTemplates.bind({}, config));
      tools.execAndLogMethod(buildHTML.bind({}, config));
    }
  }

  //------------------------------------------------------------------------------------------------

  module.exports = {
    copy: buildCopy,
    stylesheets: buildStylesheets,
    scripts: buildScripts,
    templates: buildTemplates,
    html: buildHTML,
    start: build,
  };
})();
