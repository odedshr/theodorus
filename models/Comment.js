
;(function commentModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );

  var status = { published: "published", archived: "archived", blocked: "blocked" };
  var editableFields = ['content'];

  module.exports = {
    name: 'comment',
    status: status,
    schema: {
      id: {type: 'text', key: true},
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
    getNew: function getNew ( comment ) {
      var now = new Date ();
      return {
        id : comment.id,
        authorId : comment.authorId,
        communityId: comment.communityId,
        opinionId: comment.opinionId,
        parentId: comment.parentId,
        content: comment.content,
        status: status[comment.status] ? status[comment.status] : status.published,
        created: comment.id ? comment.created : now,
        modified: now,
        endorse: comment.id ? comment.endorse : 0,
        report: comment.id ? comment.report : 0,
        comments: comment.id ? comment.comments : 0
      };
    }
  };

  function toJSON (post, isMinimal) {
    return isMinimal ? {
      id: post.id,
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
      communityId: post.communityId
    };
  }

  function getEditables () {
    return editableFields;
  }

})();