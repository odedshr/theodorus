(function userControllerClosure() {
    'use strict';

    var chain = require('../helpers/chain.js');
    var tryCatch = require('../helpers/tryCatch.js');

    function feedback (optionalUser, content, image, url, db, callback) {
        tryCatch(function tryCatchFeedback() {
            var feedback = db.feedback.model.getNew(content, image ? new Buffer(image, 'base64') : undefined, url , optionalUser ? optionalUser.id : undefined);
            db.feedback.create(feedback, chain.onSaved.bind(null, onFeedbackSaved.bind(null, callback)));
        },callback);
    }

    function onFeedbackSaved (callback, dFeedback) {
        callback({created:dFeedback.created});
    }
    exports.feedback = feedback;

})();