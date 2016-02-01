app = (typeof app != "undefined") ? app:{};
(function signupEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.frmSignUp = (function registerSignUpForm (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-sign-up',onSignUpSubmitted.bind(this)).getDispatcher('submit-sign-up');
        callback();
    }).bind(this);

    function onSignUpSubmitted (evt) {
        var email = O.ELM.signUpEmail.value;
        var password = O.ELM.signUpPassword.value;
        var retypePassword = O.ELM.signUpRetypePassword.value;
        var signUpDetails = {
            email: email,
            password: password
        };
        O.AJAX.post(this.backend + 'signup', signUpDetails, onSignUpResponded.bind(this));
        return false;
    }

    function onSignUpResponded (response) {
        if (response instanceof Error) {
            alert ('failed to sign up');
        } else {
            O.COOKIE('authToken', response, 1);
            this.api.clearCache();
            this.updateURL('','');
        }
    }

return this;}).call(app);