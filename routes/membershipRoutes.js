(function membershipRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/community/[communityId]/membership': {
        get: {
          description: 'Join a community or update membership details',
          parameters: { communityId: 'id'},
          response: {'200': { memberships: 'array[memberships]' }},
          handler: controllers.membership.list
        },
        put: {
          description: 'Join a community or update membership details',
          parameters: { membership: 'membership', communityId: 'id'},
          response: {'200': { membership: 'membership' }},
          handler: controllers.membership.set
        }
      },
      '/community/[communityId]/quit': {
        get: {
          description: 'Removes the current user from a community',
          parameters: { communityId: 'id'},
          response: {'200': {}},
          handler: controllers.membership.archive
        }
      },
      '/membership': {
        get: {
          description: 'Return all memberships of current user',
          parameters: {},
          response: {'200': { memberships: 'array[memberships]' }},
          handler: controllers.membership.list
        }
      },
      '/membership/[membershipId]/': {
        get: {
          description: 'Return membership data',
          parameters: { membershipId: 'id' },
          response: {'200': { membership: 'membership'}},
          handler: controllers.membership.get
        },
        post: {
          description: 'Update membership data',
          parameters: { membershipId: 'id', membership: 'membership' },
          response: {'200': { membership: 'membership'}},
          handler: controllers.membership.set
        },
        delete: {
          description: 'Removes the current user from a community',
          parameters: { membershipId: 'id' },
          response: {'200': { membership: 'membership'}},
          handler: controllers.membership.archive
        }
      },
      '/membership/exists': {
        post: {
          description: 'Return true if membership exists',
          parameters: { membership: 'membership' },
          response: {'200': {type: 'string', exists: 'boolean', parameters: 'object'}},
          handler: controllers.membership.exists
        }
      }
    };
  };
})();
