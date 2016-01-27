(function topicRoutesClosure() {
   'use strict';

   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/communityController');
       }

       return [
            { method: 'post', url: new RegExp('^\\/community\\/?$'), handler: controller.add },
            { method: 'post', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/?$') , handler: controller.update, parameters: { communityId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/?$'), handler: controller.get, parameters: { communityId: {alias: '0' }} },
            { method: 'delete', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/?$') , handler: controller.archive, parameters: { communityId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/community\\/?$'), handler: controller.list, parameters: {} }
       ];
   };
})();