app = (typeof app !== 'undefined') ? app : {};
(function signinEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.frmSignIn = { attributes : { onsubmit : onSignInSubmitted.bind(this)}};

  function onSignInSubmitted (evt) {
    var formValues = this.getFormFields(evt.target);
    this.api.signIn(formValues.email, formValues.password, onSignInResponded.bind(this,true));
    return false;
  }

  function onSignInResponded (rememberMe, response) {
    if (response instanceof Error) {
      alert ('failed to sign in');
    } else {
      O.COOKIE('authToken', response, rememberMe ? 30 : 1);
      this.api.clearCache();
      this.goToStateRedirect();
    }
  }

return this;}).call(app);
