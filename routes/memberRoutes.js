(function memberRoutesClosure() {
    'use strict';

    //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/membershipController');
       }

       return [
            { method: 'get', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/members\\/?$'), handler: controller.list, parameters: { communityId: {alias: '0' }} },
            { method: 'post', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/members\\/?$'), handler: controller.add, parameters: { communityId: {alias: '0' }} },
            { method: 'post', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/quit\\/?$'), handler: controller.quit, parameters: { communityId: {alias: '0' }} },
            { method: 'post', url: new RegExp('^\\/membership\\/' + validators.maskedIdPattern +'\\/reject\\/?$'), handler: controller.reject, parameters: { membershipId: {alias: '0' }} },
            { method: 'post', url: new RegExp('^\\/membership\\/' + validators.maskedIdPattern +'\\/decline\\/?$'), handler: controller.decline, parameters: { membershipId: {alias: '0' }} },
            { method: 'post', url: new RegExp('^\\/membership\\/' + validators.maskedIdPattern +'\\/update\\/?$'), handler: controller.update, parameters: { membershipId: {alias: '0' }} },

            { method: 'get', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/requests\\/?$'), handler: controller.requests, parameters: { communityId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/community\\/' + validators.maskedIdPattern +'\\/invitations\\/?$'), handler: controller.invitations, parameters: { communityId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/membership\\/' + validators.maskedIdPattern +'\\/communities\\/?$'), handler: controller.listCommunities, parameters: { membershipId: {alias: '0' }} },
            { method: 'get', url: new RegExp('^\\/membership\\/?$'), handler: controller.listCommunities, parameters: {} }
       ];

   };
})();