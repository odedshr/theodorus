;(function conversationModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  var editableFields = [];
  var jsonMinimalFields = [];
  var jsonFields = [];

  module.exports = {
    name: 'conversation',
    schema: {
      id: {type: 'text', key: true},
      created: Date,
      modified: Date
    },
    relations: function (model, models) {
      model.hasMany('participants',models.membership, {joined: Date}, { field: 'participantId', required: true, reverse: 'conversations', key: true});
    },
    methods: {
      toJSON: function (isMinimal) {
        return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: utils.simplyReturn.bind({},editableFields)
    },
    validations: {}
  };

})();