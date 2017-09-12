/* global appName */
;(function postsEnclosure(scope) {
  'use strict';

  function Posts() {}

  Posts.prototype.getAttachmentsURL = {
    getAttachmentsURL: function getAttachmentsURL(items) {
      var output = [];

      if (!!items) {
        items.forEach(function(item) {
          output.push({
            id: item,
            src: scope.api.getAttachmentURL(item),
            status: 'existing'
          });
        });
      }

      return output;
    }
  };

  scope.posts = new Posts();

})(window[appName]);
