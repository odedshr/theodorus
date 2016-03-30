/*
 * CommentViewpoint is set of values a user can give to comment
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function CommentViewpointClosure() {
  'use strict';

  module.exports = {
    name: 'commentViewpoint',
    schema: {
      created: Date,
      modified: Date,
      read: Boolean,
      endorse: Boolean,
      follow: Boolean,
      report: Boolean
    },
    relations: function (model, models) {
      model.hasOne('member',models.membership, { field: 'memberId', required: true});
      model.hasOne('comment',models.opinion, { field: 'commentId', required: true});
    },
    methods: {},
    validations: {}
  };

})();
