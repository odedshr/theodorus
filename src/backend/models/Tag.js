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
  var utils = require ( '../helpers/modelUtils.js' );

  var editableFields = ['read', 'follow', 'endorse', 'report'];
  var jsonMinimalFields = ['value', 'subjectId', 'count'];
  var jsonFields = ['id', 'value', 'memberId', 'subjectId', 'count'];
  var schema = {
    id: { type: 'text', key: true },
    value: String,
    count: { type: 'integer' }
  };
  var methods = {
    toJSON: function (isMinimal) {
      return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
    },
    getEditables: utils.simplyReturn.bind({},editableFields)
  };
  var statsTag = {
    name: 'tag',
    schema: {
      id: { type: 'text', key: true },
      count: { type: 'integer' }
    },
    relations: function () {},
    methods: {
      toJSON: function () {
        return utils.toJSON(this, ['id','count']);
      }
    },
    validations: {},
    getNew: function getNew (id, count) {
      return {
        id: id,
        count: count
      };
    }
  };

  function getNew (value, memberId, subjectId, count) {
    return {
      value: value,
      memberId: memberId,
      subjectId: subjectId,
      count: count
    };
  }

  function modelRelations (subjectType, model, models) {
    model.hasOne('member',models.membership, { field: 'memberId', required: true});
    model.hasOne('subject',models[subjectType], { field: 'subjectId', required: true});
  }

  function getTag(subjectType) {
    return subjectType ? {
      name: subjectType + 'Tag',
      schema: schema,
      relations: modelRelations.bind(null,subjectType),
      methods: methods,
      validations: {},
      getNew: getNew
    } : statsTag;
  }

  module.exports = [
    getTag('membership'),
    getTag('community'),
    getTag('topic'),
    getTag()
  ];

})();