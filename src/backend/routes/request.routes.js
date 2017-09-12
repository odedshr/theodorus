(function requestRoutesClosure() {
  'use strict';

  module.exports = function requestRoutes(controllers) {
    return {
      '/community/[communityId]/requests': {
        get: {
          description: 'Return list of all pending requests to join an exclusive community',
          parameters: { communityId: 'id' },
          response: { 200: { members: 'array[memberships]' } },
          handler: controllers.request.list
        },
        put: {
          description: 'Add request to join an exclusive community',
          parameters: { membership: 'membership', communityId: 'id' },
          response: { 200: {} },
          handler: controllers.request.set
        },
        delete: {
          description: 'Cancel request to join an exclusive community',
          parameters: { communityId: 'id' },
          response: { 200: {} },
          handler: controllers.request.archive
        }
      },
      '/membership/[membershipId]/reject': {
        get: {
          description: 'Reject a user request from joining an exclusive community',
          parameters: { membershipId: 'id' },
          response: { 200: {} },
          handler: controllers.membership.archive
        }
      },
      '/request/[requestId]/': {
        get: {
          description: 'Get pending requests to join an exclusive community',
          parameters: { requestId: 'id' },
          response: { 200: { membership: 'membership' } },
          handler: controllers.request.get
        },
        post: {
          description: 'Update request',
          parameters: { membership: 'membership', requestId: 'id' },
          response: { 200: { membership: 'membership' } },
          handler: controllers.request.set
        },
        delete: {
          description: 'Cancel request to join an exclusive community',
          parameters: { requestId: 'id' },
          response: { 200: {} },
          handler: controllers.request.archive
        }
      }
    };
  };
})();
