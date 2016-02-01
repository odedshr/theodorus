app = (typeof app != "undefined") ? app:{};
(function signinEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.frmSignIn = (function registerSignInForm (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-sign-in',onSignInSubmitted.bind(this)).getDispatcher('submit-sign-in');
        callback();
    }).bind(this);

    function onSignInSubmitted (evt) {
        var email = O.ELM.signInEmail.value;
        var password = O.ELM.signInPassword.value;
        var signInDetails = {
            email: email,
            password: password
        };
        O.AJAX.post(this.backend + 'signin', signInDetails, onSignInResponded.bind(this,true));
        return false;
    }

    function onSignInResponded (rememberMe, response) {
        if (response instanceof Error) {
            alert ('failed to sign in');
        } else {
            O.COOKIE('authToken', response, rememberMe ? 30 : 1);
            this.api.clearCache();
            this.updateURL('','');
        }
    }

return this;}).call(app);