(function orchestrate() {
  'use strict';

  var express = require('express');
  var bodyParser = require('body-parser');
  var app = express();

  var config = require('./helpers/config.js');
  var log = require('./helpers/logger.js');
  var Context = require('./helpers/context.js');
  var db = require('./helpers/db.js');
  var FileManager = require('./helpers/FileManager.js')(config('storedFilesFolder'));
  var Mailer = require('./helpers/Mailer.js')(config('mail'));
  var Errors = require('./helpers/Errors.js');
  var iterateFiles = require('./helpers/iterateFiles.js');

  var controllersFolder = './controllers';

  function setHeaders(req, res, next) {
    if (req.headers.origin !== undefined) {
      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
  }

  try {
    // Add headers
    app.use(setHeaders);
    app.use(bodyParser.json({limit: '50mb'})); // for parsing application/json
    app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded

    try {
      app.use(db.useExpress(config('dbConnectionString', true),config('guidLength')));
    }
    catch (err) {
      log('failed to connect to DB: ' + config('dbConnectionString'));
      log(err);
      throw err;
    }

    app.use(express.static('./static/www'));

    var controllers = {};
    iterateFiles(controllersFolder, function perController(controller, controllerName) {
      controllers[controllerName.substr(0, controllerName.indexOf('Controller'))] = controller;
      controller.setControllers(controllers)
    });
    var routes = controllers.system.getRoutes(controllers);
    var urls = Object.keys(routes);

    while (urls.length) {
      var url = urls.pop();
      var urlDef = routes[url];
      var methods = Object.keys(urlDef);

      while (methods.length) {
        var method = methods.pop();
        var def = urlDef[method];
        if (def.handler) {
          var context = new Context(url, def, FileManager, Mailer);
          app[method](context.getURL(), context);
        } else {
          throw new Error(' no handler for ' + method + url);
        }
      }
    }

    app.set('port', config('port'));
    app.set('ip', config('ipAddress'));

    app.listen(app.get('port'), app.get('ip'), function serverStarted() {
      log('Node server running ' + config('appName') + ' on ' + config('ipAddress') + ':' + config('port'), 'info');
      if (config('environment') === 'dev') {
        log('using ' + config('dbConnectionString'));
      }
    });
  } catch (err) {
    log('Failed to init app :-(');
    log(err);
  }


})();