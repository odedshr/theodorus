(function RouterManagerEnclosure() {
  'use strict';

  var Context = require('../helpers/context.js'),
      Errors = require('../helpers/Errors.js'),
      iterateFiles = require('../helpers/iterateFiles.js'),
      controllersFolder = '../controllers';

  function perController(controllers, ctrl, name) {
    controllers[name.substr(0, name.indexOf('.controller'))] = ctrl;

    if (ctrl.setControllers) {
      ctrl.setControllers(controllers);
    }
  }

  function populate(app, config) {
    var storedFilesFolder = config('storedFilesFolder'),
        FileManager = require('../helpers/FileManager.js')(storedFilesFolder),
        theodorusMail = config('THEODORUS_MAIL'),
        Mailer = require('../helpers/Mailer.js')(theodorusMail, FileManager),
        controllers = {},
        routes;

    iterateFiles(controllersFolder, perController.bind({}, controllers));

    routes = controllers.system.getRoutes(controllers);
    Object.keys(routes).forEach(function perURL(url) {
      var urlDef = routes[url];

      Object.keys(urlDef).forEach(function perMethod(method) {
        var def = urlDef[method],
            context;

        if (def.handler) {
          context = new Context(url, def, FileManager, Mailer);

          app[method](context.getURL(), context);
        } else {
          throw Errors.notFound('handler', method + url);
        }
      });
    });
  }

  module.exports = populate;
})();
