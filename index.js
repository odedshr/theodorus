(function orchestrate() {
    'use strict';

    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    var config = require('./helpers/config.js');
    var log = require('./helpers/logger.js');
    var createContext = require('./helpers/Context.js');
    var db = require('./helpers/db.js');
    var iterateFiles = require('./helpers/iterateFiles.js');
    var routesFolder = './routes';

    try {
        app.use(bodyParser.json()); // for parsing application/json
        app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

        try {
            app.use(db.useExpress(config('dbConnectionString', true)));
        }
        catch (err) {
            log ('failed to connect to DB: ' + config('dbConnectionString'));
            log (err);
            throw err;
        }

        app.use(express.static('./static/www'));

        iterateFiles(routesFolder, function perController(controllerRoutes) {
            var route, routes = controllerRoutes();
            while (routes.length) {
                route = routes.pop();
                app[route.method](route.url, createContext(route.handler, route.parameters));
            }
        });

        app.listen (config ('port'), config ('ipAddress'), function serverStarted() {
            log ('Node server running ' + config('appName') + ' on ' + config('ipAddress') + ':' + config('port'), 'info');
        });
    } catch (err) {
        log ('Failed to init app :-(' + err);
    }


})();