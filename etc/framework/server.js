;(function server() {
  'use strict';

  var express = require('express');
  var bodyParser = require('body-parser');
  var app = express();
  var backend = '../../src/backend/';
  var config = require(backend + 'helpers/config.js');
  var db = require(backend + 'helpers/db.js');
  var Errors = require(backend + 'helpers/Errors.js');
  var log = require(backend + 'helpers/logger.js');
  var populate = require(backend + 'helpers/RouteManager.js');

  // -----------------------------------------------------------------------------------------------

  function setHeaders(req, res, next) {
    /* following code is used for cross-domain access
    *var allowed;

    if ((allowed = req.headers.origin) !== undefined) {
      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', allowed);
    } else if ((allowed = config('defaultOrigin')) !== undefined) {
      res.setHeader('Access-Control-Allow-Origin', allowed);
    }*/

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods',
                  'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers',
                  'X-Requested-With,content-type,authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
  }

  // -----------------------------------------------------------------------------------------------

  function start(instanceConfig) {
    //TODO: this should be var in instanceConfig
    var developPattern = /^\/src/;
    try {
      // Add headers
      app.use(setHeaders);
      app.use(bodyParser.json({limit: '50mb'})); // for parsing application/json
      // for parsing application/x-www-form-urlencoded
      app.use(bodyParser.urlencoded({extended: true}));

      try {
        app.use(db.useExpress(config('dbConnectionString', true),
                              config('guidLength')));
      }
      catch (err) {
        log('failed to connect to DB: ' + config('dbConnectionString'));
        log(err);
        throw err;
      }

      app.use('/', function(req, res, next) {
        if (instanceConfig.isProduction && req.url.match(developPattern)) {
          return res.status(403).end('403 Forbidden');
        }
        next();
      });

      (function initWebApp(app, config) {
        var webappFolder = config('webAppFolder');
        if (webappFolder !== undefined) {
          log('using ' + webappFolder + ' as web-app');
          app.use(express.static(webappFolder));
        } else {
          log('web-app not available');
        }
      })(app, config);

      populate(app, config);

      app.set('port', config('port'));
      app.set('ip', config('ipAddress'));

      app.listen(app.get('port'), app.get('ip'), function serverStarted() {
        log('Node server running ' +
            config('name') + ' on ' +
            config('ipAddress') + ':' +
            config('port'), 'info');
        if (config('environment') === 'dev') {
          log('using ' + config('dbConnectionString'));
        }
      });
    } catch (err) {
      log('Failed to init app :-(');
      log(err);
    }
  }

  // -----------------------------------------------------------------------------------------------

  module.exports.start = start;
})();
