/* global appName */
;(function membershipUiEnclosure(scope) {
  'use strict';

  function membership() {}

  membership.prototype = {
    add: function add(communityId, membership, callback) {
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

      return scope.api.membership.add(communityId, { membership: membership }, callback);
    },

    end: function end(communityId, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      return scope.api.membership.end(communityId, callback);
    },

    exists: function exists(communityId, memberName, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      if (!scope.validate.id(communityId)) {
        throw scope.error.missingInput('communityId');
      } else if (!scope.validate.string(memberName)) {
        throw scope.error.missingInput('memberName');
      }

      return scope.api.membership.exists({ membership: { communityId: communityId,
                                                      name: memberName } }, callback);
    },

    get: function get(communityId, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      if (!scope.validate.id(communityId)) {
        throw scope.error.missingInput('communityId');
      }

      return scope.api.membership.get(communityId, callback);
    },

    getDefaultFounderName: function getDefaultFounderName() {
      return scope.template.translate('title.defaultFounderName');
    },

    isValid: function isValid(community, user) {
      var age;

      scope.objects.obtain('community',
                            community,
                            scope.api.community.get.bind({}, community),
                            function(community) {
                              scope.objects.obtain('user',
                                                  user,
                                                  scope.api.user.get.bind({}, user),
                                                  function(user) { console.log(community, user); });
                            });

      if (true) {
        return false;
      }

      //verify community or communityId
      //verify user or userId

      age = moment().diff(user.birthDate, 'years');

      if (!scope.validate.range(age, community.minAge, community.maxAge, true) ||
          (community.gender !== 'undefined' && user.gender !== community.gender)) {
        return false;
      }

      return true;
    },

    list: function list(callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      return scope.api.membership.list(callback);
    },

    set: function set(membership, callback) {
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

      return scope.api.membership.set(membership.id, { membership: membership }, callback);
    }
  };

  scope.onReady(function() {
    scope.io.add(membership);
  });
})(window[appName]);
