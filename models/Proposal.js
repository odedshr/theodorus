;(function ProposalClosure() {
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
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {}
  };

})();