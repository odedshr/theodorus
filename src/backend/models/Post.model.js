
;(function postModelClosure() {
  'use strict';

  var modelUtils = require('../helpers/modelUtils.js'),
      status = modelUtils.toEnum(['starred', 'published', 'draft', 'archived']),
      editableFields = ['content'],
      jsonMinimalFields = ['id', 'parentId', 'status', 'created', 'modified', 'content', 'images', 'authorId',
                            'replies', 'score'],
      jsonFields = ['id', 'parentId', 'status', 'created', 'modified', 'content', 'images', 'authorId', 'replies',
                    'score', 'follow', 'endorse', 'report', 'communityId'];

  module.exports = {
    name: 'post',
    status: status,
    schema: {
      id: { type: 'text', key: true },
      parentId: String,
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      images: Object,
      follow: { type: 'integer' },
      endorse: { type: 'integer' },
      report: { type: 'integer' },
      replies: { type: 'integer' },
      score: Number,
      scoreDate: Date
    },
    relations: function(model, models) {
      model.hasOne('author', models.membership, { field: 'authorId', required: true });
      model.hasOne('community', models.community, { field: 'communityId', required: true });
    },

    methods: {
      toJSON: function(isMinimal) {
        return modelUtils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },

      getEditables: modelUtils.simplyReturn.bind({}, editableFields)
    },
    validations: {},
    getNew: function getNew(post) {
      var now = new Date();

      return {
        authorId: post.authorId,
        communityId: post.communityId,
        content: post.content,
        images: [],
        status: status[post.status] ? status[post.status] : status.published,
        parentId: post.parentId,
        created: now,
        modified: now,
        follow: 0,
        endorse: 0,
        report: 0,
        replies: 0
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
