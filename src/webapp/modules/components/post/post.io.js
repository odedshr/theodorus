/* global appName */
;(function postControllerEnclosure(scope) {
  'use strict';

  function post() {}

  post.prototype = {
    archive: function archive(postId, callback) {
      if (!scope.validate.id(postId)) {
        throw scope.error.missingInput('postId');
      }

      return scope.api.post.archive(postId, callback);
    },

    list: function list(communityId, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.missingInput('communityId');
      }

      return scope.api.post.list(communityId, callback);
    },

    listComments: function listComments(postId, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      if (!scope.validate.id(postId)) {
        throw scope.error.missingInput('postId');
      }

      return scope.api.post.listComments(postId, callback);
    },

    set: function set(post, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      if (post === undefined) {
        throw scope.error.missingInput('post');
      } else if (!scope.validate.id(post.communityId)) {
        throw scope.error.missingInput('post.communityId');
      }

      if (!scope.validate.id(post.id)) {
        delete post.id;
      }

      return scope.api.post.set({ post: post }, callback);
    },

    setAttribute: function setAttribute(id, attribute, callback) {
      scope.api.post.setAttribute(id, attribute, callback);
    }
  };

  scope.onReady(function() {
    scope.io.add(post);
  });

})(window[appName]);
