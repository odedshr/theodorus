;(function TopicViewpointClosure() {
  /*jshint validthis: true */
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  function toJSON (viewPoint) {
    return {
      //id: Encryption.mask (viewPoint.id),
      //memberId: Encryption.mask (viewPoint.memberId),
      //topicId: Encryption.mask (viewPoint.topicId),
      //created: viewPoint.created,
      //modified: viewPoint.modified,
      read: viewPoint.read,
      follow: viewPoint.follow,
      endorse: viewPoint.endorse,
      report: viewPoint.report
    };
  }

  module.exports = {
    name: 'topicViewpoint',
    schema: {
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
      toJSON:function thisToJSON() { return toJSON(this); }
    },
    validations: {},
    manualFields: ['read','follow','endorse','report'],
    toJSON: toJSON,
    toList: utils.toList,
    toMap: utils.toMap,
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
