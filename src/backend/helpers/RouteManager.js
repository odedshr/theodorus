(function RouterManagerEnclosure() {
  'use strict';

  var Context = require('../helpers/context.js');
  var iterateFiles = require('../helpers/iterateFiles.js');

  var controllersFolder = '../controllers';

  function perController(controllers, ctrl, name) {
    controllers[name.substr(0, name.indexOf('Controller'))] = ctrl;
    ctrl.setControllers(controllers);
  }

  function populate(app, config) {
    var storedFilesFolder = config('storedFilesFolder');
    var FileManager = require('../helpers/FileManager.js')(storedFilesFolder);
    var theodorusMail = config('THEODORUS_MAIL');
    var Mailer = require('../helpers/Mailer.js')(theodorusMail, FileManager);

    var controllers = {};
    iterateFiles(controllersFolder, perController.bind({}, controllers));
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
