(function RouterManagerEnclosure () {
  'use strict';

  var Context = require('../helpers/context.js');
  var iterateFiles = require('../helpers/iterateFiles.js');

  var controllersFolder = './controllers';

  function populate (app, config) {
    var FileManager = require('../helpers/FileManager.js')(config('storedFilesFolder'));
    var Mailer = require('../helpers/Mailer.js')(config('THEODORUS_MAIL'),FileManager);

    var controllers = {};
    iterateFiles(controllersFolder, function perController(controller, controllerName) {
      controllers[controllerName.substr(0, controllerName.indexOf('Controller'))] = controller;
      controller.setControllers(controllers);
    });
    var routes = controllers.system.getRoutes(controllers);
    var urls = Object.keys(routes);

    for (var u = 0, urlsCount = urls.length; u < urlsCount; u++) {
      var url = urls[u];
      var urlDef = routes[url];
      var methods = Object.keys(urlDef);

      for (var m = 0, methoCount = methods.length; m < methoCount; m++) {
        var method = methods[m];
        var def = urlDef[method];
        if (def.handler) {
          var context = new Context(url, def, FileManager, Mailer);
          app[method](context.getURL(), context);
        } else {
          throw new Error(' no handler for ' + method + url);
        }
      }
    }
  }

  module.exports = populate;
})();