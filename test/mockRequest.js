(function mockRequestEnclosure (){
  'use strict';

  var config = require('../helpers/config.js');
  var Errors = require('../helpers/Errors.js');
  var populate = require('../helpers/RouteManager.js');
  var models, db = require('../helpers/db.js');

  var urls = { get: [], post: [], put: [], delete: [] };
  var app = {
    get: addURL.bind(null,'get'),
    post: addURL.bind(null,'post'),
    put: addURL.bind(null,'put'),
    delete: addURL.bind(null,'delete')
  };

  populate(app, config);

  function addURL (method, url, handler) {
    urls[method].push ({url: url, handler: handler });
  }
  function request (method, url) {
    var self = {
      set: set,
      send: send,
      expect: expect,
      end: end
    };
    var req = { headers: [], params: {}, method: method, url: url, models: models, connection: { remoteAddress: '0.0.0.0' }};
    var res = {
      req: req,
      status: setActualStatusCode,
      writeHead: setHeader,
      end: sendResponse
    };

    var expectedStatusCode, actualStatusCode = 200;
    var responseDestination;

    function set (key, value) {
      req.headers[key] = value;
      return self;
    }

    function send (data) {
      var keys = Object.keys(data);
      while (keys.length) {
        var key = keys.pop();
        req.params[key] = data[key];
      }
      return self;
    }

    function expect (statusCode, data, callback) {
      expectedStatusCode = statusCode;
      if (data) {
        send(data);
      }
      if (callback) {
        end(callback);
      }
      return self;
    }

    function findContext (routes, url) {
      var routesLength = routes.length;
      for (var i = 0; i < routesLength; i++) {
        var route = routes[i];
        if (url.match(route.url)) {
          return route.handler;
        }
      }
      return false;
    }

    function setActualStatusCode (statusCode) {
      actualStatusCode = statusCode;
      return res;
    }

    function setHeader (statusCode, header) {
      actualStatusCode = statusCode;
      return res;
    }

    function sendResponse (data) {
      var output = {
        status: actualStatusCode,
        expected: expectedStatusCode,
        text: data
      };

      if (expectedStatusCode !== undefined && expectedStatusCode !== actualStatusCode) {
        responseDestination(new Error(data));
      } else {
        responseDestination (null, output);
      }
    }

    function endWithModels (callback) {
      responseDestination = callback;
      var context = findContext(urls[method], url);
      if (context) {
        context(req, res);
      } else {
        callback (Errors.notFound('url',url));
      }
    }

    function end (callback) {
      if (models) {
        endWithModels (callback);
      } else {
        db.connect(config('dbConnectionString', true),config('guidLength'), function gotModels (dbModels) {
          models = dbModels;
          req.models = models; //fix the current request as well
          endWithModels (callback);
        });
      }
      return self;
    }

    return self;
  }

  module.exports = function () {
    return {
      get: request.bind ({}, 'get'),
      post: request.bind ({}, 'post'),
      put: request.bind ({}, 'put'),
      delete: request.bind ({}, 'delete')
    };
  };
})();