(function topicRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/community/[communityId]/topics': {
        get: {
          description: 'Get community\'s topics',
          parameters: {topic: 'topic', communityId: 'id'},
          response: {'200': {topics: 'array[topic]'}},
          handler: controllers.topic.list
        },
        post: {
          description: 'Add a topic',
          parameters: {topic: 'topic', communityId: 'id'},
          response: {'200': {topic: 'topic'}},
          handler: controllers.topic.set
        }
      },
      '/topic': {
        post: {
          description: 'Update a topic',
          parameters: {topic: 'topic'},
          response: {'200': {topics: 'topic'}},
          handler: controllers.topic.set
        }
      },
      '/topic/[topicId]': {
        get: {
          description: 'Get a topic',
          parameters: { topicId: 'id'},
          response: { '200': {topic: 'topic', author: 'membership', hasImage: 'boolean'}},
          handler: controllers.topic.get
        },
        post: {
          description: 'Update a topic',
          parameters: { topic: 'topic', topicId: 'id'},
          response: {'200': {topic: 'topic'}},
          handler: controllers.topic.set
        },
        delete: {
          description: 'Delete a topic',
          parameters: { topicId: 'id'},
          response: {'200': {topic: 'topic'}},
          handler: controllers.topic.archive
        }
      }
    };
  };
})();
