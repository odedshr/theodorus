;(function conversationModelClosure() {
    'use strict';
    var Encryption = require ( '../helpers/Encryption.js' );

    module.exports = {
        name: 'conversation',
        schema: {
            created: Date,
            modified: Date
        },
        relations: function (model, models) {
            model.hasMany('participants',models.membership, {joined: Date}, { field: 'participantId', required: true, reverse: 'conversations', key: true});
        },
        methods: {},
        validations: {}
    };

})();