
;(function accountModelClosure() {
  'use strict';

  var utils = require ( '../helpers/modelUtils.js' );

  var status = { active: "active", suspended: "suspended", archived: "archived"};

  var editableFields = ['content'];
  var jsonMinimalFields = [''];
  var jsonFields = [''];

  module.exports = {
    name: 'message',
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      content: String
    },
    relations: function (model, models) {
      model.hasOne('author',models.membership, { field: 'authorId', required: true });
      model.hasOne('conversation',models.conversation, { field: 'conversationId', required: true });
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