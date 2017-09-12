// cSpell:words minified, webapp, backend
;(function main() {
  'use strict';

  var cluster = require('cluster'),
      numCPUs = require('os').cpus().length,

      build = require('./etc/framework/build.js'),
      watch = require('./etc/framework/watch.js'),
      logger = require('./src/backend/helpers/logger.js'),

      config = {
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

  function addCommandLineArgs(config, argNames) {
    var params = process.argv.length > 2 ? process.argv.slice(2) : [],
        parsed = {},
        i, split;

    for (i = 0; i < params.length; i++) {
      split = params[i].split('=');

      if (split.length !== 2) {
        throw new Error('bad parameter:' + params[i]);
      } else {
        parsed[split[0]] = split[1];
      }
    }

    argNames.forEach(function perArg(key) {
      if (parsed[key] !== undefined) {
        config[key] = parsed[key];
      }
    });
  }

  function initMaster() {
    var compFileSourceFullPath = config.source + '/' + config.compileSource + '/';

    addCommandLineArgs(config, ['mode', 'run', 'build']);

    config.isProduction = !config.mode || (config.mode === 'prod');

    build.start(config);

    switch (config.mode) {
      case 'dev':
        logger(logger.color.bgWhite + logger.color.black +
               '## Starting development mode' + logger.color.reset);
        watch.start([
          { file: config.source + '/**',
          action: build.copy.bind({}, config),
          ignore: new RegExp(compFileSourceFullPath.replace(config.source, '')) },
          { file: compFileSourceFullPath + '**/*.js',
          action: build.scripts.bind({}, config) },
          { file: compFileSourceFullPath + '**/*.template.html',
          action: build.templates.bind({}, config) },
          { file: compFileSourceFullPath + '**/*.less',
          action: build.stylesheets.bind({}, config) },
          { file: compFileSourceFullPath + '/' + config.indexHtmlSourceFile,
          action: build.html.bind({}, config) }
        ]);
        break;
      case 'prod':
        break;
      default:
        logger(logger.color.red + 'unrecognized mode [' + config.mode + ']' + logger.color.reset);
        process.exit(1);
        break;
    }
  }

  function initWorker() {
    require('./etc/framework/server.js').start(config);
  }

  function startCluster() {
    if (cluster.isMaster) {
      logger('Master is running');

      initMaster();

      // Fork workers.
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        logger.error('Worker died', code, signal);
      });
    } else {
      // Workers can share any TCP connection
      // In this case it is an HTTP server
      initWorker();

      logger('Worker started');
    }
  }

  startCluster();
})();
