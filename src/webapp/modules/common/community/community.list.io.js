;(function communityUiEnclosure(scope) {
  'use strict';

  function add (id, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(communityId)) {
      throw scope.error.missingInput('communityId');
    }
    return 'tbd';
  }

  function get (communityId, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(communityId)) {
      throw scope.error.missingInput('communityId');
    }
    return scope.api.community.get(id, callback);
  }

  function list (callback) {
    if (callback === undefined) {
      callback = scope.log;
    }
    return scope.api.community.list(callback);
  }

  function set(id, callback) { return 'set Community'; }

  scope.cli._add('community', {
    add: add,
    get : get,
    list : list,
    set : set
  });
})(theodorus);
