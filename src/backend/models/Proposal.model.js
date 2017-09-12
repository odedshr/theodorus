;(function ProposalClosure() {
  'use strict';

  var utils = require ( '../helpers/modelUtils.js' );

  var status = { active: "active", suspended: "suspended", archived: "archived"};

  var editableFields = ['content'];
  var jsonMinimalFields = [];
  var jsonFields = [];

  module.exports = {
    name: 'proposal',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      noParagraphCount: Object
    },
    relations: function (model, models) {
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
