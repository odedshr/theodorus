
;(function commentModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  var status = { published: "published", archived: "archived", blocked: "blocked" };

  function toJSON (post) {
    return {
      id: Encryption.mask(post.id),
      status: post.status,
      created: post.created,
      modified: post.modified,
      content: post.content,
      endorse: post.endorse,
      report: post.report,
      comments: post.comments,
      author: post.authorJSON ? post.authorJSON : (post.author && post.author.toJSON ? post.author.toJSON() : undefined),
      authorId: Encryption.mask(post.authorId),
      community: post.communityJSON ? post.communityJSON : (post.community && post.community.toJSON ? post.community.toJSON() : undefined),
      communityId: Encryption.mask(post.communityId)
    };
  }

  module.exports = {
    name: 'comment',
    status: status,
    schema: {
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      paragraph: {type: 'integer'},
      endorse: {type: 'integer'},
      report: {type: 'integer'},
      comments: {type: 'integer'}
    },
    relations: function (model, models) {
      model.hasOne('author',models.membership, { field: 'authorId', required: true });
      model.hasOne('community',models.community, { field: 'communityId', required: true });
      model.hasOne('opinion',models.opinion, { field: 'opinionId' });
      model.hasOne('parent',models.comment, { field: 'parentId' });
    },
    methods: {
      toJSON:function thisToJSON() { return toJSON(this); }
    },
    validations: {},
    manualFields: ['status','content'],
    toJSON: toJSON,
    toList: utils.toList,
    getNew: function getNew (membershipId, communityId, opinionId, parentId, content, iStatus) {
      var now = new Date ();
      return {
        authorId : membershipId,
        communityId: communityId,
        opinionId: opinionId,
        parentId: parentId,
        content: content,
        status: status[iStatus] ? status[iStatus] : status.published,
        created: now,
        modified: now,
        endorse: 0,
        report: 0,
        comments: 0
      };
    }
  };

})();