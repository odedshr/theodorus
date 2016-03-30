(function commentRoutesClosure() {
   'use strict';

   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/commentController');
       }

       return [
           { method: 'post', url: new RegExp('^\\/comment\\/?$'), handler: controller.add },
            { method: 'post', url: new RegExp('^\\/comment\\/' + validators.maskedIdPattern +'\\/?$') , handler: controller.update, parameters: { commentId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/comment\\/' + validators.maskedIdPattern +'\\/?$'), handler: controller.get, parameters: { commentId: {alias: '0' }} },
            { method: 'delete', url: new RegExp('^\\/comment\\/' + validators.maskedIdPattern +'\\/?$') , handler: controller.archive, parameters: { commentId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/comment\\/' + validators.maskedIdPattern +'\\/comments\\/?$'), handler: controller.list, parameters: { commentId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/opinion\\/' + validators.maskedIdPattern +'\\/comments\\/?$'), handler: controller.list, parameters: { opinionId: {alias: '0' }} }
       ];
   };
})();
