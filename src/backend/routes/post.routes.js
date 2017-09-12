(function postRoutesClosure() {
  'use strict';

  module.exports = function(controllers) {
    return {
      '/community/[communityId]/posts': {
        get: {
          description: 'Get community\'s posts',
          parameters: { communityId: 'id' },
          response: { 200: { posts: 'array[post]' } },
          handler: controllers.post.list
        },
        put: {
          description: 'Add a post',
          parameters: { post: 'post', communityId: 'id' },
          response: { 200: { post: 'post' } },
          handler: controllers.post.set
        }
      },
      '/post': {
        post: {
          description: 'Update a post',
          parameters: { post: 'post' },
          response: { 200: { posts: 'post' } },
          handler: controllers.post.set
        }
      },
      '/post/[postId]': {
        get: {
          description: 'Get a post',
          parameters: { postId: 'id' },
          response: { 200: { post: 'post', author: 'membership', hasImage: 'boolean' } },
          handler: controllers.post.get
        },
        post: {
          description: 'Update a post',
          parameters: { post: 'post', postId: 'id' },
          response: { 200: { post: 'post' } },
          handler: controllers.post.set
        },
        delete: {
          description: 'Delete a post',
          parameters: { postId: 'id' },
          response: { 200: { post: 'post' } },
          handler: controllers.post.archive
        }
      },
      '/post/[parentId]/posts': {
        get: {
          description: 'get post\'s sub-posts',
          parameters: { parentId: 'id' },
          response: { 200: { posts: 'array[post]' } },
          handler: controllers.post.list
        },
        put: {
          description: 'add a sub post',
          parameters: { post: 'post', parentId: 'id' },
          response: { 200: { post: 'post' } },
          handler: controllers.post.set
        }
      },
      '/post/tag/[count]/page/[page]': {
        get: {
          description: 'Get list of post tags',
          parameters: { count: 'integer', page: 'integer' },
          response: { 200: { tags: 'map(tagValue=>count)' } },
          handler: controllers.post.listTags
        }
      },
      '/post/tag/[tags]': {
        get: {
          description: 'Get posts by tag',
          parameters: { tags: 'string' },
          response: { 200: { posts: 'array[post]', tags: 'map(postId=>array[tagValue])' } },
          handler: controllers.post.listByTag
        }
      },
      '/post/top/[count]/page/[page]': {
        get: {
          description: 'get top X posts',
          parameters: { count: 'integer', page: 'integer' },
          response: { 200: { posts: 'array[post]' } },
          handler: controllers.post.listTop
        }
      }
    };
  };
})();
