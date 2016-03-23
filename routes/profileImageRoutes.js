(function memberRoutesClosure() {
    'use strict';

    //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/profileImageController');
       }

       return [
           { method: 'get', url: new RegExp('^\\/user\\/image\\/?$'), handler: controller.getAllProfileImages, parameters: { } },
           { method: 'get', url: new RegExp('^\\/membership\\/' + validators.maskedIdPattern +'\\/image\\/?$'), handler: controller.getProfileImage, parameters: { membershipId: {alias: '0' }} },
           { method: 'post', url: new RegExp('^\\/membership\\/' + validators.maskedIdPattern +'\\/image\\/?$'), handler: controller.setProfileImage, parameters:  { membershipId: {alias: '0' }} }
       ];

   };
})();