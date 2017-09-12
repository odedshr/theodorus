(function topicRoutesClosure() {
  'use strict';

  module.exports = function (controllers) {
    var subjectTypeEnum = ['post','member'];
    return {
      '/[subjectType]/[subjectId]/read' : {
        get: {
          description: 'Mark subject as read. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.read
        }
      },
      '/[subjectType]/[subjectId]/unread' : {
        get: {
          description: 'Mark subject as unread. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.unread
        }
      },
      '/[subjectType]/[subjectId]/endorse': {
        get: {
          description: 'Mark subject as endorsed. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.endorse
        }
      },
      '/[subjectType]/[subjectId]/unendorse': {
        get: {
          description: 'Unmark subject as endorsed. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.unendorse
        }
      },
      '/[subjectType]/[subjectId]/follow': {
        get : {
          description: 'Mark subject as follow. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.follow
        }
      },
      '/[subjectType]/[subjectId]/unfollow': {
        get: {
          description: 'Unmark subject as follow. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.unfollow
        }
      },
      '/[subjectType]/[subjectId]/report': {
        post: {
          description: 'Submit report on subject. subjectType is ENUM - [topic, opinion, comment, membership]',
          parameters: { subjectType: subjectTypeEnum, subjectId: 'id', content: 'string'},
          response: {'200': {subjectType: 'string', id: 'string', action: 'string', count: 'integer'}},
          handler: controllers.review.report
        }
      }
    };
  };
})();
