app = (typeof app != "undefined") ? app:{};
(function signinEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.frmSignIn = { attributes : { onsubmit : onSignInSubmitted.bind(this)}};

    function onSignInSubmitted (evt) {
        var email = O.ELM.signInEmail.value;
        var password = O.ELM.signInPassword.value;
        this.api.signIn(email, password, onSignInResponded.bind(this,true));
        evt.detail.preventDefault();
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