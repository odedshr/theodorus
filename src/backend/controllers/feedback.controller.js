(function feedbackControllerClosure() {
  'use strict';

  var sergeant = require('../helpers/sergeant.js'),
      tryCatch = require('../helpers/tryCatch.js'),

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

      controllers = {};

  function setControllers(controllerMap) {
    controllers = controllerMap;
  }

  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  function feedback(optionalUser, content, image, url, db, callback) {
    tryCatch(function tryCatchFeedback() {
      var feedback = db.feedback.model.getNew(content, image ? new Buffer(image, 'base64') : undefined,
                    url,
                    optionalUser ? optionalUser.id : undefined);

      sergeant({
        feedback: {
          table: db.feedback,
          data: feedback,
          save: true,
          finally: json } }, 'feedback', callback);
    }, callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  exports.set = feedback;

})();
