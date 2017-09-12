(function mockRequestEnclosure() {
  'use strict';

  var helpers = '../src/backend/helpers/',
      config = require(helpers + 'config.js'),
      Errors = require(helpers + 'Errors.js'),
      populate = require(helpers + 'RouteManager.js'),
      db = require(helpers + 'db/db.js'),
      models,

      urls = { get: [], post: [], put: [], delete: [] },
      app = {
        get: addURL.bind(null, 'get'),
        post: addURL.bind(null, 'post'),
        put: addURL.bind(null, 'put'),
        delete: addURL.bind(null, 'delete')
      };

  populate(app, config);

  function addURL(method, url, handler) {
    urls[method].push({ url: url, handler: handler });
  }

  function request(method, url) {
    var self = {
          set: set,
          send: send,
          expect: expect,
          end: end
        },
        req = { headers: [],
              params: {},
              method: method,
              url: url,
              models: models,
              connection: { remoteAddress: '0.0.0.0' } },
        res = {
          req: req,
          status: setActualStatusCode,
          writeHead: setHeader,
          end: sendResponse
        },
        expectedStatusCode,
        actualStatusCode = 200,
        responseDestination;

    function set(key, value) {
      req.headers[key] = value;

      return self;
    }

    function send(data) {
      Object.keys(data).forEach(function perKey(key) {
        req.params[key] = data[key];
      });

      return self;
    }

    function expect(statusCode, data, callback) {
      expectedStatusCode = statusCode;

      if (data) {
        send(data);
      }

      if (callback) {
        end(callback);
      }

      return self;
    }

    function findContext(routes, url) {
      var route = routes.find(function perRoute(route) {
        return url.match(route.url);
      });

      if (route) {
        return route.handler;
      }

      throw Errors.notFound('context', url);
    }

    function setActualStatusCode(statusCode) {
      actualStatusCode = statusCode;

      return res;
    }

    function setHeader(statusCode) { //statusCode, header
      actualStatusCode = statusCode;

      return res;
    }

    function sendResponse(data) {
      var output = {
        status: actualStatusCode,
        expected: expectedStatusCode,
        text: data
      };

      if (expectedStatusCode !== undefined &&
          expectedStatusCode !== actualStatusCode) {
        responseDestination(new Error(data));
      } else {
        responseDestination(null, output);
      }
    }

    function endWithModels(callback) {
      var context;

      responseDestination = callback;
      context = findContext(urls[method], url);

      if (context) {
        context(req, res);
      } else {
        callback(Errors.notFound('url', url));
      }
    }

    function end(callback) {
      if (models) {
        endWithModels(callback);
      } else {
        db.connect(config('dbConnectionString', true), config('guidLength'),
          function gotModels(dbModels) {
            models = dbModels;
            req.models = models; //fix the current request as well
            endWithModels(callback);
          });
      }

      return self;
    }

    return self;
  }

  module.exports = function() {
    return {
      get: request.bind({}, 'get'),
      post: request.bind({}, 'post'),
      put: request.bind({}, 'put'),
      delete: request.bind({}, 'delete')
    };
  };
})();
