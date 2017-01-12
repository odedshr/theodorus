;(function main() {
  'use strict';

  var build = require('./etc/framework/build.js');
  var watch = require('./etc/framework/watch.js');

  var config = {
    mode: process.env.npm_package_config_defaultMode,
    run: process.env.npm_package_config_defaultIncludeModules,
    build: process.env.npm_package_config_defaultBuildWepApp,
    dest: './build/www',
    source: './src/webapp',
    // compileSource is under source's root and contain the webApp JS to be compiled
    compileSource: 'modules',
    // should be places under compileSource's root; it'll appear at the top of the
    // compiled file so all other file can assume it is loaded
    initJsFile: 'init',
    templatesFile: 'templates.html',
    templateHtmlSourceFile: 'templates.src.html',
    indexHtmlSourceFile: 'index.src.html',
    combinedJsFile: 'code.min.js',
    combinedCssFile: 'stylesheet.css',
    minifiedCssFile: 'stylesheet.min.css',
    packageJson: require('./package.json'), // used to take app.name+ ver
    buildId: (new Date()).getTime()
  };
  var compfileSourceFullPath = config.source + '/' + config.compileSource + '/';

  addCommandLineArgs(config, ['mode','run','build']);
  config.isProduction = !config.mode || (config.mode === 'prod');

  build.start(config);

  switch (config.mode) {
    case 'dev':
      watch.start([
        {file: config.source + '/**',
        action: build.copy.bind({}, config),
        ignore: new RegExp(compfileSourceFullPath.replace(config.source, ''))},
        {file: compfileSourceFullPath + '**/*.js',
        action: build.scripts.bind({}, config)},
        {file: compfileSourceFullPath + '**/*.template.html',
        action: build.templates.bind({}, config)},
        {file: compfileSourceFullPath + '**/*.less',
        action: build.stylesheets.bind({}, config)},
        {file: compfileSourceFullPath + '/' + config.indexHtmlSourceFile,
        action: build.html.bind({}, config)}
      ]);
      break;
    default:
      break;
  }

  require('./etc/framework/server.js').start(config);

  function addCommandLineArgs(config, argNames) {
    var params = process.argv.length > 2 ? process.argv.slice(2) : [];
    var parsed = {};

    for (var i = 0; i < params.length; i++) {
      var splitted = params[i].split('=');
      if (splitted.length !== 2) {
        throw new Error('bad parameter:' + params[i]);
      } else {
        parsed[splitted[0]] = splitted[1];
      }
    }

    argNames.forEach(function perArg(key) {
      if (parsed[key] !== undefined) {
        config[key] = parsed[key];
      }
    });
  }

})();
