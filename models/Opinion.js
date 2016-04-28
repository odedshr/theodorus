
;(function accountModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  var status = { published: "published", draft: "draft", archived: "archived", history: "history"};

  var editableFields = ['content'];

  module.exports = {
    name: 'opinion',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      endorse: {type: 'integer'},
      report: {type: 'integer'},
      comments: {type: 'integer'}
    },
    relations: function (model, models) {
      model.hasOne('author',models.membership, { field: 'authorId', required: true });
      model.hasOne('community',models.community, { field: 'communityId', required: true });
      model.hasOne('topic',models.topic, { field: 'topicId' });
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew ( opinion ) {
      var now = new Date ();
      return {
        id : opinion.id,
        authorId : opinion.authorId,
        communityId: opinion.communityId,
        topicId: opinion.topicId,
        content: opinion.content,
        status: status[opinion.status] ? status[opinion.status] : status.published,
        created: now,
        modified: now,
        endorse: 0,
        report: 0,
        comments: 0
      };
    }
  };

  function toJSON (post, isMinimal) {
    return isMinimal ? {
      id: post.id,
      status: post.status,
      content: post.content,
      authorId: post.authorId,
      comments: post.comments
    } : {
      id: post.id,
      status: post.status,
      created: post.created,
      modified: post.modified,
      content: post.content,
      endorse: post.endorse,
      report: post.report,
      comments: post.comments,
      authorId: post.authorId,
      communityId: post.communityId,
      history: post.history ? utils.toList(post.history) : undefined
    };
  }

  function getEditables () {
    return editableFields;
  }
})();

/*
 *   - Topic is the beginning of a discussion in a community.
 - It contains a message of 140 characters
 - It may contain up to 140 different links
 - It has a single creator (a user)
 - Response is a user's response to a topic
 - It contains a message of 140 characters (or 140 links)
 - A user may have a single response per topic
 - Comment is a feedback to a response or to another comment
 - It contains a message of 100 words
 - A user may have many comments to per response
 * */