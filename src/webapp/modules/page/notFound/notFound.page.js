/* global appName */
;(function notFoundPageEnclosure(scope) {
  'use strict';

  function NotFoundPage() {
    this.constructor.apply(this, arguments);

    return this.init;
  }

  NotFoundPage.prototype = {
    constructor: function constructor() {},

    init: function init() {
      console.log('notFound init');
    }
  };

  scope.onReady(function onReady() {
    scope.page(NotFoundPage);
  });
})(window[appName] || module.exports);
