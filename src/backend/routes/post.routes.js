import postController from '../controllers/post.controller.js';

export default {
  '/community/[communityId:id]/posts': {
    get: postController.list,
    put: postController.set
  },
  '/post': {
    post: postController.set
  },
  '/post/[id]': {
    get: postController.get,
    post: {
      description: 'Update a post',
      parameters: { post: 'post', postId: 'id' },
      response: { 200: { post: 'post' } },
      handler: postController.set
    },
    delete: {
      description: 'Delete a post',
      parameters: { postId: 'id' },
      response: { 200: { post: 'post' } },
      handler: postController.archive
    }
  },
  '/post/[id]/posts': {
    get: postController.list,
    put: postController.set
  },
  '/post/tag/[count:int]/page/[page:int]': {
    get: postController.listTags
  },
  '/post/tag/[tags:string]': {
    get: postController.listByTag
  },
  '/post/top/[count:int]/page/[page:int]': {
    get: postController.listTop
  }
};