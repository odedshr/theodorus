;(function conversationModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );
  var editableFields = [];

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
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {}
  };

  function toJSON (isMinimal) {
    return {};
  }

  function getEditables () {
    return editableFields;
  }

})();