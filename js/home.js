app = (typeof app !== 'undefined') ? app : {};
(function homeEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};
  
  this.registry.homePage = { preprocess: registerHomePage.bind(this) };
  function registerHomePage(dElm, callback) {
    callback({ isAuthenticated : this.isAuthenticated });
  }
return this;}).call(app);
