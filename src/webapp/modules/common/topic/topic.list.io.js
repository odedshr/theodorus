;(function topicListControllerEnclosure(scope) {
  'use strict';

  function list(communityId, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(communityId)) {
      throw scope.error.missingInput('communityId');
    }
    return scope.api.topic.list(communityId, callback);
  }

  function set(topic,callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (topic === undefined) {
      throw scope.error.missingInput('topic');
    } else if (!scope.validate.id(topic.communityId)) {
      throw scope.error.missingInput('topic.communityId');
    }

    return scope.api.topic.set({topic: topic}, callback);
  }

  scope.cli._add('topic', {
    list: list,
    set: set
  });
})(theodorus);
