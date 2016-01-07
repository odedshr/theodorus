(function topicRoutesClosure() {
   'use strict';

   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/topicController');
       }

       return [
            { method: 'post', url: /topic\/?/, handler: controller.add },
            { method: 'post', url: /topic\/'+' + validators.maskedIdPattern +'\/?/ , handler: controller.update, parameters: { topicId: {alias: '0' }} },
            { method: 'get', url: /topic\/'+' + validators.maskedIdPattern +'\/?/, handler: controller.get, parameters: { topicId: {alias: '0' }} },
            { method: 'delete', url: /topic\/'+' + validators.maskedIdPattern +'\/?/ , handler: controller.archive, parameters: { topicId: {alias: '0' }} },
            { method: 'get', url: /community\/'+' + validators.maskedIdPattern +'\/topics\/?/, handler: controller.list, parameters: { communityId: {alias: '0' }} }
       ];
   };
})();