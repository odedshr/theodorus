(function commentRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/opinion/[opinionId]/comments': {
        get: {
          description: 'get opinion\'s comment',
          parameters: { opinionId: 'id'},
          response: {'200': {comments: 'array[comment]'}},
          handler: controllers.comment.list
        },
        put: {
          description: 'add a comment',
          parameters: {comment: 'comment', opinionId: 'id'},
          response: {'200': {comment: 'comment'}},
          handler: controllers.comment.set
        }
      },
      '/comment': {
        post: {
          description: 'Update a comment',
          parameters: {comment: 'comment'},
          response: {'200': {comment: 'comment'}},
          handler: controllers.comment.set
        }
      },
      '/comment/[commentId]': {
        get: {
          description: 'Get a comment',
          parameters: { commentId: 'id'},
          response: {'200': {comment: 'comment', author: 'membership', hasImage: 'boolean'}},
          handler: controllers.comment.get
        },
        post: {
          description: 'Update a comment',
          parameters: { comment: 'comment', commentId: 'id'},
          response: {'200': {comment: 'comment'}},
          handler: controllers.comment.set
        },
        delete: {
          description: 'Delete a comment',
          parameters: { commentId: 'id'},
          response: {'200': { comment: 'comment'}},
          handler: controllers.comment.archive
        }
      },
      '/comment/[rootCommentId]/comments': {
        get: {
          description: 'get comment\'s comment',
          parameters: {rootCommentId: 'id'},
          response: {'200': { comments: 'array[comment]'}},
          handler: controllers.comment.list
        },
        put: {
          description: 'add a comment',
          parameters: {comment: 'comment', rootCommentId: 'id'},
          response: {'200': {comment: 'comment'}},
          handler: controllers.comment.set
        }
      }
    };
  };
})();
