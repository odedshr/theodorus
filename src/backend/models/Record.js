
;(function recordModelClosure() {
  'use strict';
  var modelUtils = require ( '../helpers/modelUtils.js' );

  var type = modelUtils.toEnum(['join', 'leave',
                                'add', 'edit', 'archive', 'endorse', 'follow', 'report', 'block', 'read']);

  function getRecordId(record) {
    var id = [ record.memberId];
    if (record.commentId) {
      id.push(record.commentId);
    } else if (record.opinionId) {
      id.push(record.opinionId);
    } else if (record.topicId) {
      id.push(record.topicId);
    } else if (record.communityId) {
      id.push(record.communityId);
    }
    if (record.authorId) {
      id.push(record.authorId);
    }
    return id.join('-');
  }
  module.exports = {
    name: 'record',
    type: type,
    schema: {
      id: { type: 'text', key: true },
      type: Object.keys(type),
      created: Date
    },
    relations: function (model, models) {
      //member is the person doing the action
      model.hasOne('member',models.membership, { field: 'memberId', required: true });
      model.hasOne('community',models.community, { field: 'communityId', required: true });
      //author is the person who created the subject (relevant for reactions)
      model.hasOne('author',models.membership, { field: 'authorId' });
      model.hasOne('topic',models.topic, { field: 'topicId' });
      model.hasOne('opinion',models.opinion, { field: 'opinionId' });
      model.hasOne('comment',models.comment, { field: 'commentId' });
    },
    methods: {},
    validations: {},
    getNew: function getNew ( record ) {
      return {
        id : getRecordId (record),
        memberId : record.memberId,
        communityId: record.communityId,
        authorId : record.authorId,
        topicId: record.topicId,
        opinionId: record.opinionId,
        commentId: record.commentId,
        type: type[record.type],
        created: record.id ? record.created : (new Date ())
      };
    }
  };

})();