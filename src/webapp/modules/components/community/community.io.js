/* global appName */
;(function communityIoEnclosure(scope) {
  'use strict';

  function community() {}

  community.prototype = {
    add: function add(parameters, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      if (!scope.validate.range(parameters.communityName.length, scope.models.community.name)) {
        throw scope.error.badInput('communityName', parameters.communityName);
      }

      if (!scope.validate.range(parameters.founderAlias.length, scope.models.membership.name)) {
        throw scope.error.badInput('founderAlias', parameters.founderAlias);
      }

      scope.api.community.add({
        community: {
          name: parameters.communityName
        },
        founder: {
          alias: parameters.founderAlias
        } }, callback);
    },

    get: function get(id, callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      if (!scope.validate.id(id)) {
        throw scope.error.missingInput('communityId');
      }

      return scope.api.community.get(id, callback);
    },

    getCommunitySpec: function getCommunitySpec() {
      var communityNameSpec = scope.models.community.name;

      return {
        minNameLength: communityNameSpec.min,
        maxNameLength: communityNameSpec.max,
        defaultFounderName: scope.io.membership.getDefaultFounderName()
      };
    },

    list: function list(callback) {
      if (callback === undefined) {
        callback = scope.log;
      }

      return scope.api.community.list(callback);
    },

    set: function set(id, callback) {
      console.log(id, callback);

      return 'set Community';
    }
  };

  scope.onReady(function() {
    scope.io.add(community);
  });

})(window[appName]);

