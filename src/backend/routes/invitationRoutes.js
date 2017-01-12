(function membershipRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/community/[communityId]/decline': {
        get: {
          description: 'Removes the current user\'s invitation to join a community',
          parameters: { communityId: 'id'},
          response: {'200': {}},
          handler: controllers.membership.archive
        }
      },
      '/community/[communityId]/invitations': {
        get: {
          description: 'Return list of all invitations sent by a user to join a community',
          parameters: {communityId: 'id'},
          response: {'200': {members: 'array[memberships]'}},
          handler: controllers.invitations.list
        },
        put: {
          description: 'Send an invitation to join a secret community',
          parameters: {membership: 'membership', communityId: 'id'},
          response: {'200': {}},
          handler: controllers.invitations.set
        }
      },
      '/user/invitations': {
        get: {
          description: 'Return list of all invitations a user received',
          parameters: {},
          response: {'200': {communities: 'map[community]', invitations: 'array[membership]'}},
          handler: controllers.invitations.list
        }
      }
    };
  };
})();
