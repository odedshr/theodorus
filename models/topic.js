
;(function accountModelClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var modelUtils = require ( '../helpers/modelUtils.js' );

  var status = modelUtils.toEnum(['published', 'draft', 'archived']);
  var editableFields = ['content'];
  var jsonMinimalFields = ['id','status','created','modified','content','images','authorId','opinions', 'score'];
  var jsonFields = ['id','status','created','modified','content','images','authorId','opinions', 'score',
                    'follow','endorse','report','communityId'];

  module.exports = {
    name: 'topic',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      images: Object,
      follow: {type: 'integer'},
      endorse: {type: 'integer'},
      report: {type: 'integer'},
      opinions: {type: 'integer'},
      score: Number,
      scoreDate: Date
    },
    relations: function (model, models) {
      model.hasOne('author',models.membership, { field: 'authorId', required: true });
      model.hasOne('community',models.community, { field: 'communityId', required: true });
    },
    methods: {
      toJSON: function (isMinimal) {
        return modelUtils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: modelUtils.simplyReturn.bind({},editableFields)
    },
    validations: {},
    getNew: function getNew ( topic ) {
      var now = new Date ();
      return {
        authorId : topic.authorId,
        communityId: topic.communityId,
        content: topic.content,
        images: [],
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