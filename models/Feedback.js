
;(function accountModelClosure() {
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );

  var status = { sent: "sent", handled: "handled", archived: "archived" };
  var editableFields = ['content', 'image','url'];

  function getEditables () {
    return editableFields;
  }

  function toJSON (feedback, isMinimal) {
    return isMinimal ? {
      content: feedback.content,
      image: feedback.image ? feedback.image.toString('base64') : '',
      url: feedback.url
    } :{
      id: Encryption.mask(feedback.id),
      status: feedback.status,
      created: feedback.created,
      modified: feedback.modified,
      content: feedback.content,
      image: feedback.image ? feedback.image.toString('base64') : '',
      url: feedback.url,
      userId: Encryption.mask(feedback.userId)
    };
  }

  module.exports = {
    name: 'feedback',
    status: status,
    schema: {
      status: Object.keys(status),
      created: Date,
      modified: Date,
      content: String,
      url: String,
      image: Buffer
    },
    relations: function (model, models) {
      model.hasOne('user',models.user, { field: 'userId' });
    },
    methods: {
      toJSON: function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    getNew: function getNew (content, image, url, userId) {
      var now = new Date ();
      return {
        userId : userId,
        url : url,
        image: image,
        content: content,
        status: status.sent,
        created: now,
        modified: now
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