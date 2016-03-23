app = (typeof app != "undefined") ? app:{};
(function signupEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.frmSignUp = { attributes: { onsubmit : onSignUpSubmitted.bind(this)} };

    function onSignUpSubmitted (evt) {
        var formValues = this.getFormFields(evt.target);
        var email = formValues.email;
        var password = formValues.password;
        var userModel = this.models.user;

        if (userModel.email.validate(email)) {
            if (userModel.password.validate(password)) {
                if (password === formValues.retypePassword) {
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
        return false;
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