
;(function accountModelClosure() {
  'use strict';

  var status = { active: "active", suspended: "suspended", archived: "archived"};

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
    methods: {},
    validations: {}
  };

})();