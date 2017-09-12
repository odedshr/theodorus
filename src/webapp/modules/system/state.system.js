/* global appName */
;(function stateSystemEnclosure(scope) {
  'use strict';
  function State(scope) {
    this.scope = scope;
  }

  State.prototype = {};

  scope.state = new State(scope);
})(window[appName]);
