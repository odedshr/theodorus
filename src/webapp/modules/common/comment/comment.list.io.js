;(function commentListControllerEnclosure(scope) {
  'use strict';

  function list (opinionId, commentId, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(opinionId) && !scope.validate.id(commentId)) {
      throw scope.error.missingInput('opinionId');
    }
    return scope.api.opinion.list(opinionId, commentId,callback);
  }

  scope.cli._add('comment', {
    list : list
  });
})(theodorus);
