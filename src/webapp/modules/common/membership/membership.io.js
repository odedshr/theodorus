;(function membershipUiEnclosure(scope) {
  'use strict';

  function add (communityId, membership, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }
    if (!scope.validate.id(communityId)) {
      throw scope.error.missingInput('communityId');
    } else if (membership === undefined) {
      throw scope.error.missingInput('membership');
    } else if (!scope.validate.string(membership.name)) {
      throw scope.error.missingInput('membership.name');
    }

    return scope.api.membership.add(communityId, {membership: membership}, callback);
  }

  function end (communityId, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    return scope.api.membership.end(communityId, callback);
  }

  function exists (communityId, memberName, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(communityId)) {
      throw scope.error.missingInput('communityId');
    } else if (!scope.validate.string(memberName)) {
      throw scope.error.missingInput('memberName');
    }

    return scope.api.membership.exists({membership:{communityId: communityId,
                                                    name: memberName}}, callback);
  }

  function list (callback) {
    if (callback === undefined) {
      callback = scope.log;
    }
    return scope.api.membership.list(callback);
  }

  function get (communityId, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }

    if (!scope.validate.id(communityId)) {
      throw scope.error.missingInput('communityId');
    }

    return scope.api.membership.get(communityId, callback);
  }

  function set(membership, callback) {
    if (callback === undefined) {
      callback = scope.log;
    }
    
    if (membership === undefined) {
      throw scope.error.missingInput('membership');
    } else if (!scope.validate.id(membership.id)) {
      throw scope.error.missingInput('membership.id');
    } else if (!scope.validate.string(membership.name)) {
      throw scope.error.missingInput('membership.name');
    }

    return scope.api.membership.set(membership.id, {membership: membership}, callback);
  }

  scope.cli._add('membership', {
    add: add,
    end: end,
    exists: exists,
    list : list,
    get : get,
    set : set
  });
})(theodorus);
