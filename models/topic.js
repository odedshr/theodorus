
;(function accountModelClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );

  var status = { published: "published", draft: "draft", archived: "archived" };
  var editableFields = ['content'];

  module.exports = {
    name: 'topic',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      follow: {type: 'integer'},
      endorse: {type: 'integer'},
      report: {type: 'integer'},
      opinions: {type: 'integer'}
    },
    relations: function (model, models) {
      model.hasOne('author',models.membership, { field: 'authorId', required: true });
      model.hasOne('community',models.community, { field: 'communityId', required: true });
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew ( topic ) {
      var now = new Date ();
      return {
        authorId : topic.authorId,
        communityId: topic.communityId,
        content: topic.content,
        status: status[topic.status] ? status[topic.status] : status.published,
        created: now,
        modified: now,
        follow: 0,
        endorse: 0,
        report: 0,
        opinions: 0
      };
    }
  };

  function toJSON (topic, isMinimal) {
    return isMinimal ? {
      id: topic.id,
      created: topic.created,
      modified: topic.modified,
      content: topic.content,
      authorId: topic.authorId,
      opinions: topic.opinions
    } : {
      id: topic.id,
      status: topic.status,
      created: topic.created,
      modified: topic.modified,
      content: topic.content,
      follow: topic.follow,
      endorse: topic.endorse,
      report: topic.report,
      opinions: topic.opinions,
      authorId: topic.authorId,
      communityId: topic.communityId
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