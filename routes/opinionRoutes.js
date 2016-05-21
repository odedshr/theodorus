(function opinionRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    return {
      '/topic/[topicId]/opinions': {
        get: {
          description: 'Get topic\'s opinions',
          parameters: { opinion: 'opinion', topicId: 'id' },
          response: { '200': { opinions: 'array[opinion]' }},
          handler: controllers.opinion.list
        },
        put: {
          description: 'Add an opinion',
          parameters: { opinion: 'opinion', topicId: 'id' },
          response: { '200': { opinion: 'opinion' }},
          handler: controllers.opinion.set
        }
      },
      '/opinion': {
        post: {
          description: 'Update an opinion',
          parameters: { opinion: 'opinion' },
          response: { '200': { opinion: 'opinion' }},
          handler: controllers.opinion.set
        }
      },
      '/opinion/[opinionId]': {
        get: {
          description: 'Get an opinion',
          parameters: { opinionId: 'id' },
          response: { '200': { opinion: 'opinion', author: 'membership', hasImage: 'boolean' }},
          handler: controllers.opinion.get
        },
        post: {
          description: 'Update an opinion',
          parameters: { opinion: 'opinion', opinionId: 'id' },
          response: { '200': { opinion: 'opinion' }},
          handler: controllers.opinion.set
        },
        delete: {
          description: 'Delete an opinion',
          parameters: { opinionId: 'id' },
          response: { '200': { opinion: 'opinion' }},
          handler: controllers.opinion.archive
        }
      }
    };
  };
})();