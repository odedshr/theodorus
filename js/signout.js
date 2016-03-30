app = (typeof app !== 'undefined') ? app : {};
(function signoutEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.btnSignOut = { attributes: { onclick : onSignOutClicked.bind(this)} };

  function onSignOutClicked (evt) {
    O.COOKIE('authToken','');
    this.state.email = '';
    this.api.clearCache();
    this.goToStateRedirect();
    return false;
  }

return this;}).call(app);
