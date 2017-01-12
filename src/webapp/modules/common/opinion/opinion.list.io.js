;(function opinionListControllerEnclosure(scope) {
  'use strict';

  function list (topicId, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(topicId)) {
      throw scope.error.missingInput('topicId');
    }
    return scope.api.opinion.list(topicId, callback);
  }

  scope.cli._add('opinion', {
    list : list
  });
})(theodorus);
