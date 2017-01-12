(function topicRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/community/[communityId]/topics': {
        get: {
          description: 'Get community\'s topics',
          parameters: { communityId: 'id' },
          response: {'200': { topics: 'array[topic]' }},
          handler: controllers.topic.list
        },
        put: {
          description: 'Add a topic',
          parameters: { topic: 'topic', communityId: 'id' },
          response: {'200': { topic: 'topic' }},
          handler: controllers.topic.set
        }
      },
      '/topic': {
        post: {
          description: 'Update a topic',
          parameters: { topic: 'topic' },
          response: {'200': { topics: 'topic' }},
          handler: controllers.topic.set
        }
      },
      '/topic/[topicId]': {
        get: {
          description: 'Get a topic',
          parameters: { topicId: 'id' },
          response: { '200': { topic: 'topic', author: 'membership', hasImage: 'boolean' }},
          handler: controllers.topic.get
        },
        post: {
          description: 'Update a topic',
          parameters: { topic: 'topic', topicId: 'id' },
          response: { '200': { topic: 'topic' }},
          handler: controllers.topic.set
        },
        delete: {
          description: 'Delete a topic',
          parameters: { topicId: 'id' },
          response: { '200': { topic: 'topic' }},
          handler: controllers.topic.archive
        }
      },
      '/topic/tag/[count]/page/[page]': {
        get: {
          description: 'Get list of topic tags',
          parameters: { count: 'integer', page: 'integer' },
          response: {'200': { tags: 'map(tagValue=>count)' }},
          handler: controllers.topic.listTags
        }
      },
      '/topic/tag/[tags]': {
        get: {
          description: 'Get topics by tag',
          parameters: { tags: 'string' },
          response: {'200': { topics: 'array[topic]', tags: 'map(topicId=>array[tagValue])' }},
          handler: controllers.topic.listByTag
        }
      },
      '/topic/top/[count]/page/[page]': {
        get: {
          description: 'get top X topics',
          parameters: { count: 'integer', page: 'integer' },
          response: { '200': { topics: 'array[topic]' }},
          handler: controllers.topic.listTop
        }
      }
    };
  };
})();
