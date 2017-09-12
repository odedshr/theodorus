/* global appName */
// cSpell:words describedby
;(function addCommunityFormEnclosure(scope) {
  'use strict';

  function addCommunityForm() {}

  addCommunityForm.prototype = {
    init: function init(dElm) {
      this.dElm = dElm;
      dElm.onsubmit = this.submitForm.bind(this, dElm);
    },

    submitForm: function submitForm(dElm) {
      try {
        scope.io.community.add(scope.form.getFields(dElm), this.formSubmitted.bind(this));
      }
      catch (err) {
        console.log(err);
      }

      return false;
    },

    formSubmitted: function formSubmitted(response) {
      if (scope.error.isError(response)) {
        console.log('error', response, this.dElm.getAttribute('aria-describedby'));

        switch (response.status) {
          case 409:
            document.getElementById(this.dElm.getAttribute('aria-describedby'))
                    .innerHTML = scope.template.translate('error.namedAlreadyBeingUsed');
            break;
          default:
            document.getElementById(this.dElm.getAttribute('aria-describedby'))
                    .innerHTML = response.status + ' ' + response.message;
        }
      } else {
        scope.page.goTo('/community/' + response.community.id);
      }

    }
  };

  scope.onReady(function() {
    scope.ui.add(addCommunityForm);
  });

})(window[appName]);
