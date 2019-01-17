import communityController from '../controllers/community.controller.js';

export default {
  '/community/exists': { post: communityController.exists },
  '/community/tag/[tags]': { get: communityController.listByTag },
  '/community/[id]': {
    get: communityController.get,
    post: communityController.set,
    delete: communityController.archive,
  },
  '/community': {
    get: communityController.list,
    put: communityController.set
  },
  '/community/top/[count:int]/page/[page:int]': {
    get: communityController.listTop
  }
};