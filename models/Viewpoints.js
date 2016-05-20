/*
 * Viewpoint is the relationship between user to another user in his community
 - He can follow (meaning, he'll get notification on the user's activities)
 - He can endorse (meaning, he'll automatically endorse anything the representative will endorse)
 - He can report of misconduct
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function ViewpointClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  var editableFields = {
    membership : ['read', 'follow', 'endorse', 'report','block'],
    topic : ['read', 'follow', 'endorse', 'report'],
    opinion : ['read', 'endorse', 'report'],
    comment : ['read', 'endorse', 'report']
  }
  var jsonMinimalFields = ['subjectId', 'read', 'follow', 'endorse', 'report','score'];
  var jsonFields = ['id', 'memberId', 'subjectId', 'created', 'modified', 'read', 'follow', 'endorse', 'report','score'];
  var schema = {
    id: { type: 'text', key: true },
    created: Date,
    modified: Date,
    endorse: Boolean,
    read: Boolean,
    report: String,
    score: Number,
    scoreDate: Date
  };
  var methods = {
    toJSON: function (isMinimal) {
      return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
    },
    getEditables: utils.simplyReturn.bind({},editableFields)
  };

  function getNew (membershipId, subjectId) {
    var now = new Date ();
    return {
      memberId: membershipId,
      subjectId: subjectId,
      created: now,
      modified: now,
      read: false,
      endorse: false,
      report: undefined
    };
  }

  function getViewPoint(subjectType) {
    return {
      name: subjectType + 'Viewpoint',
      schema: schema,
      relations: function (model, models) {
        model.hasOne('member',models.membership, { field: 'memberId', required: true});
        model.hasOne('subject',models[subjectType], { field: 'subjectId', required: true});
      },
      methods: methods,
      validations: {},
      getNew: getNew
    };
  }

  function adjustForMembership(model) {
    //membership needs to have its own schema
    model.schema = JSON.parse(JSON.stringify(model.schema));
    model.schema.block = Boolean;
    model.schema.follow = Boolean;
    delete model.schema.read;
    return model;
  }

  function adjustForTopic(model) {
    model.schema = JSON.parse(JSON.stringify(model.schema));
    model.schema.follow = Boolean;
    return model;
  }

  module.exports = [
    adjustForMembership(getViewPoint('membership')),
    adjustForTopic(getViewPoint('topic')),
    getViewPoint('opinion'),
    getViewPoint('comment')
  ];

})();