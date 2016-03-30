
;(function accountModelClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );
  var status = { published: "published", draft: "draft", archived: "archived" };

  function toJSON (topic) {
    return {
      id: Encryption.mask(topic.id),
      status: topic.status,
      created: topic.created,
      modified: topic.modified,
      content: topic.content,
      follow: topic.follow,
      endorse: topic.endorse,
      report: topic.report,
      opinions: topic.opinions,
      author: topic.authorJSON ? topic.authorJSON : (topic.author && topic.author.toJSON ? topic.author.toJSON() : undefined),
      authorId: Encryption.mask(topic.authorId),
      community: topic.communityJSON ? topic.communityJSON : (topic.community && topic.community.toJSON ? topic.community.toJSON() : undefined),
      communityId: Encryption.mask(topic.communityId),
      viewpoint: topic.viewpointJSON ? topic.viewpointJSON : (topic.viewpoint && topic.viewpoint.toJSON ? topic.viewpoint.toJSON() : undefined)
    };
  }

  module.exports = {
    name: 'topic',
    status: status,
    schema: {
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
      toJSON:function thisToJSON() { return toJSON(this); }
    },
    validations: {},
    manualFields: ['status','content'],
    toJSON: toJSON,
    toList: utils.toList,
    getNew: function getNew (membershipId, communityId, content, iStatus) {
      var now = new Date ();
      return {
        authorId : membershipId,
        communityId: communityId,
        content: content,
        status: status[iStatus] ? status[iStatus] : status.active,
        created: now,
        modified: now,
        follow: 0,
        endorse: 0,
        report: 0,
        opinions: 0
      };
    }
  };

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