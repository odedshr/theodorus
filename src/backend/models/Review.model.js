//cSpell:words Editables
/*
 * Review is the relationship between user to another user in his community
 - He can follow (meaning, he'll get notification on the user's activities)
 - He can endorse (meaning, he'll automatically endorse anything the representative will endorse)
 - He can report of misconduct
 - It contains the flags - Endorse, Follow, Report
 - Endorse and Report are mutually exclusive
 */

;(function ReviewClosure() {
  'use strict';

  var utils = require('../helpers/modelUtils.js'),
      editableFields = {
        membership: ['read', 'follow', 'endorse', 'report', 'block'],
        post: ['read', 'follow', 'endorse', 'report']
      },
      jsonMinimalFields = ['subjectId', 'read', 'follow', 'endorse', 'report', 'score'],
      jsonFields = ['id',
                    'memberId',
                    'subjectId',
                    'created',
                    'modified',
                    'read',
                    'follow',
                    'endorse', 'report',
                    'score'],
      schema = {
        id: { type: 'text', key: true },
        created: Date,
        modified: Date,
        endorse: Boolean,
        read: Boolean,
        report: String,
        score: Number,
        scoreDate: Date
      },
      methods = {
        toJSON: function(isMinimal) {
          return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
        },

        getEditables: utils.simplyReturn.bind({}, editableFields)
      };

  function getNew(membershipId, subjectId) {
    var now = new Date();

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

  function getReviewModel(subjectType) {
    return {
      name: subjectType + 'Review',
      schema: schema,
      relations: function(model, models) {
        model.hasOne('member', models.membership, { field: 'memberId', required: true });
        model.hasOne('subject', models[subjectType], { field: 'subjectId', required: true });
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

  function adjustForPost(model) {
    model.schema = JSON.parse(JSON.stringify(model.schema));
    model.schema.follow = Boolean;

    return model;
  }

  module.exports = [
    adjustForMembership(getReviewModel('membership')),
    adjustForPost(getReviewModel('post'))
  ];

})();
