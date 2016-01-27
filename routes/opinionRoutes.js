(function opinionRoutesClosure() {
   'use strict';

   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/opinionController');
       }

       return [
            { method: 'post', url: new RegExp('^\\/opinion\/?$'), handler: controller.add },
            { method: 'post', url: new RegExp('^\\/opinion\\/' + validators.maskedIdPattern +'\\/?$') , handler: controller.update, parameters: { opinionId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/opinion\\/' + validators.maskedIdPattern +'\\/?$'), handler: controller.get, parameters: { opinionId: {alias: '0' }} },
            { method: 'delete', url: new RegExp('^\\/opinion\\/' + validators.maskedIdPattern +'\\/?$') , handler: controller.archive, parameters: { opinionId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/topic\\/' + validators.maskedIdPattern +'\\/opinions\\/?$'), handler: controller.list, parameters: { topicId: {alias: '0' }} }
       ];
   };
})();