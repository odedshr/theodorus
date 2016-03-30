(function topicRoutesClosure() {
   'use strict';

   module.exports = function (controller, validators) {
       if (validators === undefined) {
           validators = require('../helpers/validators.js');
       }

       if (controller === undefined) {
           controller = require('../controllers/viewpointController');
       }

       var idPattern = validators.maskedIdPattern;
       var subject = '([topic|opinion|comment]+)';

       return [
           { method: 'post', url: new RegExp('^\\/'+subject+'\\/' + idPattern +'\\/read\\/?$') , handler: controller.read, parameters: { subjectType: {alias: '0' }, subjectId: {alias: '1' }} },
           { method: 'post', url: new RegExp('^\\/'+subject+'\\/' + idPattern +'\\/unread\\/?$') , handler: controller.unread, parameters: { subjectType: {alias: '0' }, subjectId: {alias: '1' }} },
           { method: 'post', url: new RegExp('^\\/'+subject+'\\/' + idPattern +'\\/endorse\\/?$') , handler: controller.endorse, parameters: { subjectType: {alias: '0' }, subjectId: {alias: '1' }} },
           { method: 'post', url: new RegExp('^\\/'+subject+'\\/' + idPattern +'\\/unendorse\\/?$') , handler: controller.unendorse, parameters: { subjectType: {alias: '0' }, subjectId: {alias: '1' }} },
           { method: 'post', url: new RegExp('^\\/'+subject+'\\/' + idPattern +'\\/follow\\/?$') , handler: controller.follow, parameters: { subjectType: {alias: '0' }, subjectId: {alias: '1' }} },
           { method: 'post', url: new RegExp('^\\/'+subject+'\\/' + idPattern +'\\/unfollow\\/?$') , handler: controller.unfollow, parameters: { subjectType: {alias: '0' }, subjectId: {alias: '1' }} }
       ];
   };
})();
