/*
 * OpinionViewpoint is set of values a user can give to opinion
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function OpinionViewpointClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var editableFields = ['read','follow','endorse', 'report'];

  module.exports = {
    name: 'opinionViewpoint',
    schema: {
      id: {type: 'text', key: true},
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
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew (membershipId, opinionId) {
      var now = new Date ();
      return {
        memberId : membershipId,
        opinionId: opinionId,
        created: now,
        modified: now,
        read: false,
        follow: false,
        endorse: false
      };
    }
  };

  function toJSON (viewPoint, isMinimal) {
    return isMinimal ? {
      read: viewPoint.read,
      follow: viewPoint.follow,
      endorse: viewPoint.endorse,
      report: viewPoint.report
    } : {
      id: viewPoint.id,
      memberId: viewPoint.memberId,
      opinionId: viewPoint.opinionId,
      created: viewPoint.created,
      modified: viewPoint.modified,
      read: viewPoint.read,
      follow: viewPoint.follow,
      endorse: viewPoint.endorse,
      report: viewPoint.report
    };
  }

  function getEditables () {
    return editableFields;
  }

})();
