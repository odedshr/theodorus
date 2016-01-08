(function orchestrate() {
    'use strict';

    var express = require('express');
    var bodyParser = require('body-parser');
    var app = express();
    var config = require('./helpers/config.js');
    var log = require('./helpers/logger.js');
    var createContext = require('./helpers/context.js');
    var db = require('./helpers/db.js');
    var iterateFiles = require('./helpers/iterateFiles.js');
    var routesFolder = './routes';

    try {
        // Add headers
        app.use(function (req, res, next) {

            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', true);

            // Pass to next layer of middleware
            next();
        });
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

        app.set('port', config ('port'));
        app.set('ip', config ('ipAddress'));

        app.listen (app.get('port') ,app.get('ip'), function serverStarted() {
            log ('Node server running ' + config('appName') + ' on ' + config('ipAddress') + ':' + config('port'), 'info');
        });
    } catch (err) {
        log ('Failed to init app :-(' + err);
    }


})();