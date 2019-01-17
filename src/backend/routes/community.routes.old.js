import communityController from '../controllers/community.controller.js';

export default {
  '/community/exists': {
    post: {
      description: 'Return true if community exists',
      parameters: { community: 'community' },
      response: {'200': { type: 'string', exists: 'boolean', parameters: 'object' }},
      handler: communityController.exists
    }
  },
  '/community/tag/[tags]': {
    get: {
      description: 'Get community list',
      parameters: { tags: 'string'},
      response: {'200': { communities: 'array[community]', tags: 'map(communityId=>array[tagValue])' }},
      handler: communityController.listByTag
    }
  },
  '/community/[communityId]': {
    get: {
      description: 'Get a community',
      parameters: { communityId: 'id'},
      response: {'200': { community: 'community', member: 'membership', hasImage: 'boolean' }},
      handler: communityController.get
    },
    post: {
      description: 'Update community',
      parameters: { community: 'community', communityId: 'id' },
      response: {'200': { community: 'community', founder: 'membership' }},
      handler: communityController.set
    },
    delete: {
      description: 'Delete a community',
      parameters: {communityId: 'id'},
      response: {'200': { community: 'community' }},
      handler: communityController.archive
    }
  },
  '/community': {
    get: {
      description: 'Get community list',
      response: {'200': { communities: 'array[community]' }},
      handler: communityController.list
    },
    put: {
      description: 'Add a community',
      parameters: { community: 'community', communityImage: 'image', founder: 'membership', founderImage: 'image' },
      response: {'200': { community: 'community', founder: 'membership' }},
      handler: communityController.set
    }
  },
  '/community/top/[count]/page/[page]': {
    get: {
      description: 'get top X communities',
      parameters: { count: 'integer', page: 'integer' },
      response: { '200': { communities: 'array[community]' }},
      handler: communityController.listTop
    }
  }
};