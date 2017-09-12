//cSpell:words guid
;(function server() {
  'use strict';

  const express = require('express'),
        bodyParser = require('body-parser'),
        app = express(),
        backEnd = '../../src/backEnd/',
        config = require(backEnd + 'helpers/config.js'),
        db = require(backEnd + 'helpers/db/db.js'),
        log = require(backEnd + 'helpers/logger.js'),
        populate = require(backEnd + 'helpers/RouteManager.js');

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
    var developPattern = /^\/src/g;

    try {
      // Add headers
      app.use(setHeaders);
      app.use(bodyParser.json({ limit: '50mb' })); // for parsing application/json
      // for parsing application/x-www-form-urlencoded
      app.use(bodyParser.urlencoded({ extended: true }));

      try {
        app.use(db.useExpress(config('dbConnectionString', true),
                              config('guidLength')));
      }
      catch (err) {
        log('failed to connect to DB: ' + config('dbConnectionString'));
        log(err);
        throw err;
      }

      app.use('/', function preventAccessToSource(req, res, next) {
        // not in debug mode but trying to access src files
        if (instanceConfig.isProduction && req.url.match(developPattern)) {
          return res.status(403).end('403 Forbidden');
        }

        next();
      });

      (function initWebApp(app, config) {
        var webAppFolder = config('webAppFolder');

        if (webAppFolder !== undefined) {
          log('using ' + webAppFolder + ' as web-app');
          app.use(express.static(webAppFolder));
        } else {
          log('web-app not available');
        }

        populate(app, config);

        app.use('/', function onPageNotFound(req, res) {
          res.sendFile(process.cwd() + '/' + webAppFolder + '/index.html');
        });
      })(app, config);

      app.set('port', config('port'));
      app.set('ip', config('ipAddress'));

      app.listen(app.get('port'), app.get('ip'), function serverStarted() {
        log('Node server running ' + config('name') + ' on ' + config('ipAddress') + ':' + config('port'));

        if (config('environment') === 'dev') {
          log('using ' + config('dbConnectionString'));
        }
      });
    } catch (err) {
      log(' Failed to init app :-(');
      log(err);
    }
  }

  // -----------------------------------------------------------------------------------------------

  module.exports.start = start;
})();
