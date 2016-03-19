app = (typeof app != "undefined") ? app:{};
(function signupEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.frmSignUp = { attributes: { onsubmit : onSignUpSubmitted.bind(this)} };

    function onSignUpSubmitted (evt) {
        var email = O.ELM.signUpEmail.value;
        var password = O.ELM.signUpPassword.value;
        var retypePassword = O.ELM.signUpRetypePassword.value;
        var userModel = this.models.user;
        if (userModel.email.validate(email)) {
            if (userModel.password.validate(password)) {
                if (password === retypePassword) {
                    this.api.signUp(email, password, onSignUpResponded.bind(this));
                } else {
                    this.log('retype password',this.logType.error)
                }
            } else {
                this.log('illegal password',this.logType.error);
            }
        } else {
            this.log('illegal email',this.logType.error);
        }
        evt.detail.preventDefault();
    }

    function onSignUpResponded (response) {
        if (response instanceof Error) {
            alert ('failed to sign up');
        } else {
            O.COOKIE('authToken', response, 1);
            this.api.clearCache();
            this.goToStateRedirect();
        }
    }

return this;}).call(app);