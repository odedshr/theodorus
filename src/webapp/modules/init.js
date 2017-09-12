// cSpell:words theodorus
/* global buildId, appName */
;(function initEnclosure(scope) {
  'use strict';

  var appInstance;

  function AppInstance() {
    var scope = 'defaultScope',
        scopes = {};

    setArgumentsFromUrl(this);

    function App(param) {
      return getScope(param);
    }

    function getScope(param) {
      switch (typeof param) {
        case 'function': // use default scope
          return addCodeToScope(scopes[scope] || addScope(scope), param);
        case 'string': // use alternative scope
          return addCodeToScope.bind(scopes[param] || addScope(param));
        default: // unknown type
          return App.error.badInput(param);
      }
    }

    function addScope(param) {
      scopes[param] = {};

      return scopes[param];
    }

    function addCodeToScope(scope, code) {
      code.call(scope);

      return addCodeToScope.bind(scope);
    }

    ////////////////////////////////////////////////////////////////////////////

    App.isDebug = (function isDebug() {
      var url = location.href;

      return (url.indexOf('localhost') !== -1) ||
              (url.indexOf('127.0.0.1') !== -1);
    })();
    App.init = new Boot(App);
    App.onReady = App.init.addPreInitCode;

    return App;
  }

  function setArgumentsFromUrl(target) {
    var codeUrl = document.currentScript.getAttribute('src');

    if (codeUrl.indexOf('?') > -1) {
      codeUrl.substr(codeUrl.indexOf('?') + 1)
             .split('&')
             .forEach(function perArgument(argumentPair) {
              var item = argumentPair.split('=');

              target[item[0]] = item[1];
            });
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  function Boot(scope) {
    var self = this;

    function Init() {
      // running everything set in "onReady()" calls
      self.syncPreInitCodes.forEach(function perCode(code) {
        code(self.scope);
      });

      // TODO: run waitOnReady Function
      self.init.continues.call(this);
    }

    self.init = Init.bind(this);
    self.scope = scope;
    self.syncPreInitCodes = [];

    self.init.continues =  function initContinues() {
      var initData = { count: 2 };

      scope.template.setLocale('en-us');
      scope.template.loadLanguage('/i18n/en-us.json',
                         self.init.complete.bind(this, initData));
      scope.template.load('/templates.html?' + (buildId || ''),
                 self.init.complete.bind(this, initData));
    };

    self.init.complete = function initFinished(initData) {
      if (!--initData.count) {
        self.scope.page.go();
      }
    };

    self.init.addPreInitCode = (function addPreInitCode(code) {
      if (typeof code !== 'function') {
        throw appInstance.error('badInput', 'code', typeof code);
      }

      self.syncPreInitCodes.push(code);

      return self;
    }).bind(self);

    return self.init;
  }

  //////////////////////////////////////////////////////////////////////////////
  appInstance = new AppInstance();

  // DOMContentLoaded happens before window.onload
  document.addEventListener('DOMContentLoaded', appInstance.init);

  // default appName if undefined
  if (scope[appName] === undefined) {
    scope[appName] = 'app';
  }

  scope[appName] = appInstance;

})((typeof window !== 'undefined') ? window : (module ? module.exports : global));
