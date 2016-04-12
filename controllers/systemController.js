(function userControllerClosure() {
  'use strict';

  var md5 = require ('md5');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var iterateFiles = require('../helpers/iterateFiles.js');
  var validators = require('../helpers/validators.js');
  var tryCatch = require('../helpers/tryCatch.js');

  var routesFolder = './routes';

  var version = require ('../package.json').version;

  function ping (callback) {
    tryCatch(function tryCatchPing() {
      callback('pong');
    },callback);
  }

  function getEmail (optionalUser, callback) {
    tryCatch(function tryCatchPing() {
      callback({'email': optionalUser ? optionalUser.email : ''});
    },callback);
  }

  function getVersion (callback) {
    tryCatch(function tryCatchPing() {
      callback({'version': require('../package.json').version});
    },callback);
  }

  function api (callback) {
    tryCatch(function tryCatchAPI() {
      callback({
        title: 'Theodorus REST API',
        version: version,
        schemes: ['https'],
        produces: ['application/json'],
        routes: routes
      });
    },callback);
  }

  var routes = {};

  function getRoutes (controllers) {
    routes = {};

    iterateFiles(routesFolder, function perRouteCollection(routeCollection) {
      var collection = routeCollection(controllers);
      var urls = Object.keys(collection);
      while (urls.length) {
        var url = urls.pop();
        routes[url] = collection[url];
      }
    });
    return routes;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};
  function setControllers (controllerMap) {
    controllers = controllerMap;
  }
  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  exports.ping = ping;
  exports.version = version;
  exports.getEmail = getEmail;
  exports.api = api;
  exports.getRoutes = getRoutes;
  exports.getVersion = getVersion;


})();