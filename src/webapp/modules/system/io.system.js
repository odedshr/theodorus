/* global appName */
;(function ioSystemEnclosure(scope) {
  'use strict';
  function IO(scope) {
    this.scope = scope;
    this.components = [];
  }

  IO.prototype = {
    add: function(IOComponent) {
      this[IOComponent.name] = new IOComponent(scope);
    }
  };

  scope.io = new IO(scope);
})(window[appName] || module.exports);
