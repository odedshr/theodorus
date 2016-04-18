;(function CommentViewpointClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var editableFields = ['read','follow','endorse', 'report'];

  module.exports = {
    name: 'commentViewpoint',
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
      model.hasOne('comment',models.comment, { field: 'commentId', required: true});
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew (membershipId, commentId) {
      var now = new Date ();
      return {
        memberId : membershipId,
        commentId: commentId,
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
      commentId: viewPoint.commentId,
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
