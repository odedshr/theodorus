/* global appName */
;(function homePageEnclosure(scope) {
  'use strict';

  function HomePage() {
    this.constructor.apply(this, arguments);

    return this.init;
  }

  HomePage.prototype = {
    constructor: function constructor() {
      this.init = this.init.bind(this);
      this.init.url = '/';
    },

    init: function init() {
      scope.page.render('home', {
        isConnected: scope.io.user.isConnected()
      });
    }
  };

  scope.onReady(function() {
    scope.page(HomePage);
  });

})(window[appName] || module.exports);
