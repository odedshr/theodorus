(function userControllerClosure() {
    'use strict';

    //{ method: 'get', url: new RegExp('user\/password\/' + validators.emailPatternString + '\/?'), handler: userController.generateResetPasswordToken, parameters: { username: {alias: '0' }} },
   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/feedbackController');
       }

       return [
           { method: 'post', url: new RegExp('^\\/feedback\\/?$'), handler: controller.feedback }
       ];
   };
})();