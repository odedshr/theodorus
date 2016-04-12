
;(function commentModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );

  var status = { published: "published", archived: "archived", blocked: "blocked" };
  var editableFields = ['content'];

  function toJSON (post, isMinimal) {
    return isMinimal ? {
      id: Encryption.mask(post.id),
      content: post.content,
      authorId: Encryption.mask(post.authorId)
    } : {
      id: Encryption.mask(post.id),
      status: post.status,
      created: post.created,
      modified: post.modified,
      content: post.content,
      endorse: post.endorse,
      report: post.report,
      comments: post.comments,
      authorId: Encryption.mask(post.authorId),
      communityId: Encryption.mask(post.communityId)
    };
  }

  function getEditables () {
    return editableFields;
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
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
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