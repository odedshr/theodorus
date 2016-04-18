;(function TopicViewpointClosure() {
  /*jshint validthis: true */
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var editableFields = ['read','follow','endorse', 'report'];

  function toJSON (viewPoint, isMinimal) {
    return isMinimal ? {
      read: viewPoint.read,
      follow: viewPoint.follow,
      endorse: viewPoint.endorse,
      report: viewPoint.report
    } : {
      id: viewPoint.id,
      memberId: viewPoint.memberId,
      topicId: viewPoint.topicId,
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

  module.exports = {
    name: 'topicViewpoint',
    schema: {
      id: {type: 'text', key: true},
      created: Date,
      modified: Date,
      read: Boolean,
      endorse: Boolean,
      follow: Boolean,
      report: String
    },
    relations: function (model, models) {
      model.hasOne('member',models.membership, { field: 'memberId', required: true});
      model.hasOne('topic',models.topic, { field: 'topicId', required: true});
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    toJSON: toJSON,
    getNew: function getNew (membershipId, topicId) {
      var now = new Date ();
      return {
        memberId : membershipId,
        topicId: topicId,
        created: now,
        modified: now,
        read: false,
        follow: false,
        endorse: false
      };
    }
  };

})();
