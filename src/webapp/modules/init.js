;(function initEnclosure(scope) {
  'use strict';

  function CLI () {}
  function addToPrototype(type, name, func) {
    type.prototype[name] = func;
  }
  function lockObjects () {
    [CLI].forEach(function lockObject (obj) {
      delete obj.prototype._add;
    });
  }
  [CLI].forEach(function UnLockObject (obj) {
    obj.prototype._add = addToPrototype.bind({},obj);
  });

  init();

  function init() {
    //init requires 3 steps to take place:
    // (i) load strings
    // (ii) load templates
    // (iii) window ready
    var initData = {count: 3};
    scope.cli = new CLI();

    scope.registry = {};
    scope.state = {};
    if (isDebug()) { // if not, then don't show the variable.
      scope.debug = true;
    }
    window.onload = onInitCompleted.bind(scope, initData);
    O.TPL.loadLanguage('i18n/en-us.json',
                       onInitCompleted.bind(scope, initData));
    O.TPL.load('templates.html?' + buildId,
               onInitCompleted.bind(scope, initData));
  }

  function onConnectionError() {
    if (document.getElementById('connectionError') === null) {
      scope.notify({notifyErrorConnection: {}});
    }
  }

  function isDebug() {
    var url = location.href;
    return (url.indexOf('localhost') !== -1) ||
           (url.indexOf('127.0.0.1') !== -1);
  }

  function onInitCompleted(initData) {
    if (!--initData.count) {
      //TODO: read language from cookie or wherever.
      O.TPL.setLocale('en-us');

      lockObjects ();

      scope.api.onConnectionError = onConnectionError;
      scope.invoke(document.getElementById('app'));
    }
  }

})((function setNamespace(appName) {
  var global = (typeof window !== 'undefined') ?
                window :
                (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }

  return global[appName];
})('theodorus'));
