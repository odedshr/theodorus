(function topicRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/community/exists': {
        post: {
          description: 'Return true if community exists',
          parameters: {community: 'community'},
          response: {'200': {type: 'string', exists: 'boolean', parameters: 'object'}},
          handler: controllers.community.exists
        }
      },
      '/community/tag/[tags]': {
        get: {
          description: 'Get community list',
          parameters: { tags: 'string'},
          response: {'200': { communities: 'array[community]', tags: 'map(communityId=>array[tagValue])' }},
          handler: controllers.community.listByTag
        }
      },
      '/community/[communityId]': {
        get: {
          description: 'Get a community',
          parameters: { communityId: 'id'},
          response: {'200': {community: 'community', member: 'membership', hasImage: 'boolean'}},
          handler: controllers.community.get
        },
        post: {
          description: 'Update community',
          parameters: {community: 'community', communityId: 'id'},
          response: {'200': {community: 'community', founder: 'membership'}},
          handler: controllers.community.set
        },
        delete: {
          description: 'Delete a community',
          parameters: {communityId: 'id'},
          response: {'200': {community: 'community'}},
          handler: controllers.community.archive
        }
      },
      '/community': {
        get: {
          description: 'Get community list',
          response: {'200': {communities: 'array[community]'}},
          handler: controllers.community.list
        },
        put: {
          description: 'Add a community',
          parameters: {community: 'community', founder: 'membership', founderImage: 'image'},
          response: {'200': {community: 'community', founder: 'membership'}},
          handler: controllers.community.set
        }
      },
      '/community/top/[count]/page/[page]': {
        get: {
          description: 'get top X communities',
          parameters: { count: 'integer', page: 'integer'},
          response: { '200': { communities: 'array[community]'}},
          handler: controllers.community.listTop
        }
      }
    };
  };
})();