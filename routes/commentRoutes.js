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
            { method: 'post', url: /comment\/?/, handler: controller.add },
            { method: 'post', url: /comment\/'+' + validators.maskedIdPattern +'\/?/ , handler: controller.update, parameters: { commentId: {alias: '0' }} },
            { method: 'get', url: /comment\/'+' + validators.maskedIdPattern +'\/?/, handler: controller.get, parameters: { commentId: {alias: '0' }} },
            { method: 'delete', url: /comment\/'+' + validators.maskedIdPattern +'\/?/ , handler: controller.archive, parameters: { commentId: {alias: '0' }} },
            { method: 'get', url: /comment\/'+' + validators.maskedIdPattern +'\/comments\/?/, handler: controller.list, parameters: { parentId: {alias: '0' }} },
            { method: 'get', url: /opinion\/'+' + validators.maskedIdPattern +'\/comments\/?/, handler: controller.list, parameters: { opinionId: {alias: '0' }} }
       ];
   };
})();