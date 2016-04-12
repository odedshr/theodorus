
;(function accountModelClosure() {
  'use strict';

  var status = { active: "active", suspended: "suspended", archived: "archived"};

  var editableFields = ['content'];

  function toJSON (isMinimal) {
    return {};
  }
  function getEditables () {
    return editableFields;
  }

  module.exports = {
    name: 'message',
    schema: {
      status: Object.keys(status),
      created: Date,
      content: String
    },
    relations: function (model, models) {
      model.hasOne('author',models.membership, { field: 'authorId', required: true });
      model.hasOne('conversation',models.conversation, { field: 'conversationId', required: true });
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {}
  };

})();