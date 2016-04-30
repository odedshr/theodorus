(function RouterManagerEnclosure () {

  var Context = require('./context.js');
  var iterateFiles = require('./iterateFiles.js');

  var controllersFolder = '../controllers';

  function populate (app) {
    var controllers = {};
    iterateFiles(controllersFolder, function perController(controller, controllerName) {
      controllers[controllerName.substr(0, controllerName.indexOf('Controller'))] = controller;
      controller.setControllers(controllers);
    });
    var routes = controllers.system.getRoutes(controllers);
    var urls = Object.keys(routes);

    while (urls.length) {
      var url = urls.pop();
      var urlDef = routes[url];
      var methods = Object.keys(urlDef);

      while (methods.length) {
        var method = methods.pop();
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