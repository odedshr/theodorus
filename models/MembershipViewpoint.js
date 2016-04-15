/*
 * Interaction is the relationship between user to another user in his community
 - He can follow (meaning, he'll get notification on the user's activities)
 - He can endorse (meaning, he'll automatically endorse anything the representative will endorse)
 - He can report of misconduct
 */

/*
 * Rating is set of values a user can give to topic/response/comment
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function MembershipViewpointClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var status = { active: "active", suspended: "suspended", archived: "archived"};

  var editableFields = ['read','follow','endorse', 'report'];

  function getEditables () {
    return editableFields;
  }

  function toJSON (viewPoint, isMinimal) {
    return isMinimal ? {
      read: viewPoint.read,
      follow: viewPoint.follow,
      endorse: viewPoint.endorse,
      report: viewPoint.report
    } : {
      id: Encryption.mask (viewPoint.id),
      memberId: Encryption.mask (viewPoint.memberId),
      subjectId: Encryption.mask (viewPoint.subjectId),
      created: viewPoint.created,
      modified: viewPoint.modified,
      read: viewPoint.read,
      follow: viewPoint.follow,
      endorse: viewPoint.endorse,
      report: viewPoint.report
    };
  }

  module.exports = {
    name: 'membershipViewpoint',
    status: status,
    schema: {
      status: Object.keys(status),
      created: Date,
      modified: Date,
      endorse: Boolean,
      follow: Boolean,
      report: Boolean,
      block: Boolean
    },
    relations: function (model, models) {
      model.hasOne('member',models.membership, { field: 'memberId', required: true});
      model.hasOne('subject',models.membership, { field: 'subjectId', required: true});
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew (membershipId, subjectId) {
      var now = new Date ();
      return {
        memberId : membershipId,
        subjectId: subjectId,
        created: now,
        modified: now,
        read: false,
        follow: false,
        endorse: false
      };
    }
  };

})();