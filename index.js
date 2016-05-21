(function orchestrate() {
  'use strict';

  var express = require('express');
  var bodyParser = require('body-parser');
  var app = express();

  var config = require('./helpers/config.js');
  var db = require('./helpers/db.js');
  var Errors = require('./helpers/Errors.js');
  var log = require('./helpers/logger.js');
  var populate = require('./helpers/RouteManager.js');

  function setHeaders(req, res, next) {
    var allowed;

    if ((allowed = req.headers.origin) !== undefined) {
      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', allowed);
    } else if ((allowed = config('defaultOrigin')) !== undefined){
      res.setHeader('Access-Control-Allow-Origin', allowed);
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

    populate(app, config);

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