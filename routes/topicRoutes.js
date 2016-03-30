(function topicRoutesClosure() {
   'use strict';

   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/topicController');
       }

       var idPattern = validators.maskedIdPattern;
       return [
            { method: 'post', url: new RegExp('^\\/topic\\/' + idPattern +'\\/?$') , handler: controller.update, parameters: { topicId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\//topic\\/' + idPattern +'\\/?$'), handler: controller.get, parameters: { topicId: {alias: '0' }} },
            { method: 'delete', url: new RegExp('^\\/topic\\/' + idPattern +'\\/?$') , handler: controller.archive, parameters: { topicId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/community\\/' + idPattern +'\\/topics\\/?$'), handler: controller.list, parameters: { communityId: {alias: '0' }} },
            { method: 'post', url: new RegExp('^\\/topic\\/?$'), handler: controller.add }
       ];
   };
})();
