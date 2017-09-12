/* global appName */
;(function addPostFormEnclosure(scope) {
  'use strict';

  function setPostForm() {}

  setPostForm.prototype = {
    init: function init(dElm) {
      dElm.onsubmit = this.submitForm.bind(this, dElm);
      scope.ui.textField.init(document.getElementById('postContent'));
    },

    submitForm: function submitForm(dElm) {
      try {
        var fields = scope.form.getFields(dElm),
            post = {
              content: fields.content
            };

        if (scope.validate.id(fields.id)) {
          post.id = fields.id;
        }

        if (scope.validate.id(fields.parentId)) {
          post.parentId = fields.parentId;
        }

        if (scope.validate.id(fields.communityId)) {
          post.communityId = fields.communityId;
        }

        scope.io.post.set(post, this.formSubmitted);
      }
      catch (err) {
        console.log(err);
      }

      return false;
    },

    formSubmitted: function formSubmitted(response) {
      if (scope.error.isError(response)) {
        console.log('error', response);
      } else {
        console.log('TODO: update community list!!!!', response);
      }

    }
  };

  scope.onReady(function() {
    scope.ui.add(setPostForm);
  });

})(window[appName]);
