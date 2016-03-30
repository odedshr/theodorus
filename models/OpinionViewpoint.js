/*
 * OpinionViewpoint is set of values a user can give to opinion
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function OpinionViewpointClosure() {
  'use strict';

  module.exports = {
    name: 'opinionViewpoint',
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
      model.hasOne('opinion',models.opinion, { field: 'opinionId', required: true});
    },
    methods: {},
    validations: {}
  };

})();
