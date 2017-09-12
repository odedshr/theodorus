/* global appName */
;(function signInFormEnclosure(scope) {
  'use strict';

  function signInForm() {}

  signInForm.prototype = {
    init: function init(dElm) {
      document.querySelector('.sign-in-form-email-field')
              .setAttribute('pattern', scope.pattern.simpleEmail);
      dElm.onsubmit = this.submitForm.bind(this, dElm);
    },

    submitForm: function submitForm(dElm) {
      var parameters = scope.form.getFields(dElm);

      scope.io.user.authenticate(parameters.email, this.onSignInFormSubmitted);

      return false;
    },

    onSignInFormSubmitted: function onSignInFormSubmitted(response) {
      var data = { signInFormResponse: { isSent: (response.output === 'sent') } };

      document.getElementById('signInEmailResponse').innerHTML = scope.template.render(data);
    }
  };

  scope.onReady(function() {
    scope.ui.add(signInForm);
  });

})(window[appName] || module.exports);
