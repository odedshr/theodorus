(function RecordManagerEnclosure () {
  'use strict';
  var Errors = require('../helpers/Errors.js');
  var sergeant = require('../helpers/sergeant.js');

  function getNewTask (db, type) {
    var types = db.record.model.type,
        isReaction = (type === types.endorse || type === types.follow || type === types.report);

    return { table: db.record, beforeSave: before.bind(null, type, isReaction, db), save: true, finally:sergeant.remove  };
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function before (type, isReaction, db, data, tasks) {
    var member, authorId, topic, topicId, opinion, opinionId, comment, commentId;
    if (data.author) {
      member = data.author;
    } else if (data.founder) {
      member = data.founder;
    } else if (data.membership) {
      member = data.membership;
    } else if (data.member) {
      member = data.member;
    } else {
      console.log ('no member?!');
    }

    if (data.topic) {
      topic = data.topic;
      topicId = topic.id;
      authorId = topic.authorId;
    } else if (data.opinion) {
      opinion = data.opinion;
      opinionId = opinion.id;
      authorId = opinion.authorId;
      topicId = opinion.topicId;
    } else if (data.comment) {
      comment = data.comment;
      commentId = comment.id;
      authorId = comment.authorId;
      opinionId = comment.opinionId;
      if (data.parent && data.parent.topicId) {
        topicId = data.parent.topicId;
      }
    }
    if (!isReaction) {
      authorId = undefined;
    }
    tasks.record.data = db.record.model.getNew({
      memberId : member.id,
      communityId: data.community ? data.community.id : undefined,
      authorId : authorId,
      topicId: topicId,
      opinionId: opinionId,
      commentId: commentId,
      type: type
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  module.exports.getNewTask = getNewTask;

})();