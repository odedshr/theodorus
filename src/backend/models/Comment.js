
;(function commentModelClosure() {
  'use strict';
  var utils = require ( '../helpers/modelUtils.js' );
  var status = { published: 'published', archived: 'archived', blocked: 'blocked' };

  var editableFields = ['content'];
  var jsonMinimalFields = ['id','content','authorId','comments', 'images'];
  var jsonFields = ['id','status','created','modified','content','images','endorse','report','comments','authorId','communityId'];

  module.exports = {
    name: 'comment',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      images: Object,
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
      toJSON: function (isMinimal) {
        return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: utils.simplyReturn.bind({}, editableFields)
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
        images: [],
        status: status[comment.status] ? status[comment.status] : status.published,
        created: comment.id ? comment.created : now,
        modified: now,
        endorse: comment.id ? comment.endorse : 0,
        report: comment.id ? comment.report : 0,
        comments: comment.id ? comment.comments : 0
      };
    }
  };

})();