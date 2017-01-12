;(function communityModelClosure() {
  'use strict';

  var Errors = require ( '../helpers/Errors.js' );
  var modelUtils = require ( '../helpers/modelUtils.js' );
  var validators = require ( '../helpers/validators.js' );

  var status = modelUtils.toEnum(['active', 'suspended', 'archived']);
  var gender = modelUtils.toEnum(['undefined', 'female', 'male']);
  var type = modelUtils.toEnum(['public', 'exclusive', 'secret']);

  var editableFields = ['name','description','topicLength', 'opinionLength','commentLength','minAge','maxAge','gender','type', 'hasImage'];
  var jsonMinimalFields = ['id','name','description','hasImage','members','topics','type','modified','score'];
  var jsonFields = ['id','status','created','modified','name','description','hasImage','founderId','members','topicLength','opinionLength','commentLength','minAge','maxAge','gender','type','topics'];
  var minNameLen = 1;
  var maxNameLen = 15;
  var minDescriptionLen = 1;
  var maxDescriptionLen = 140;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports = {
    name: 'community',
    schema: {
      id: { type: 'text', key: true },
      status: Object.keys(status),
      created: Date,
      modified: Date, // modified reflects any related activity
      name: String,
      description: String,
      hasImage: Boolean,
      topicLength:  { type: 'integer' },  //xx>0 words, xx<0 characters, 0=no limit
      opinionLength:  { type: 'integer' },  //xx>0 words, xx<0 characters, 0=no limit
      commentLength:  { type: 'integer' }, //xx>0 words, xx<0 characters, 0=no limit
      minAge: { type: 'integer' },
      maxAge: { type: 'integer' },
      gender: Object.keys(gender),
      type: Object.keys(type),
      members: { type: 'integer' },
      topics: { type: 'integer' },
      score: Number,
      scoreDate: Date
    },
    relations: function (model, models) {
      model.hasOne('founder',models.membership, { field: 'founderId' });
    },
    methods : {
      isFit: function isFit (user) {
        var value = true;
        var userAge = user.birthDate ? (new Date()).getFullYear() - (new Date(user.birthDate)).getFullYear() : false;
        if (+this.minAge > 0) {
          value = value && userAge && (userAge > this.minAge);
        }
        if (+this.maxAge > 0) {
          value = value && userAge && (userAge > this.maxAge);
        }
        if (this.gender && this.gender !== gender.undefined) {
          value = value && (this.gender ===user.gender);
        }
        return value;
      },
      isTopicLengthOk: function isTopicLengthOk (message) {
        return validators.isPostLengthOK(message, this.topicLength);
      },
      isOpinionLengthOk: function isOpinionLengthOk (message) {
        return validators.isPostLengthOK(message, this.opinionLength);
      },
      isCommentLengthOk: function isCommentLengthOk (message) {
        return validators.isPostLengthOK(message, this.commentLength);
      },
      isValid: function () {
        return isValid(this);
      },
      toJSON: function (isMinimal) {
        return modelUtils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: modelUtils.simplyReturn.bind({},editableFields)
    },
    validations: {},
    status : status,
    gender : gender,
    type : type,
    isValid: isValid,
    getNew: getNew
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function getNew ( community) {
    var now = new Date ();
    return {
      id : community.communityId,
      founderId : community.founderId,
      name: community.name,
      description: community.description,
      hasImage: !!community.hasImage,
      topics: 0,
      members: 1, // at least the founder is a member
      status: status[community.status] ? status[community.status] : status.active,
      created: now,
      modified: now,
      topicLength: (community.topicLength !== undefined) ? +community.topicLength : -140,
      opinionLength: (community.opinionLength !== undefined) ? +community.opinionLength : -140,
      commentLength: (community.commentLength !== undefined) ? +community.commentLength : 100,
      minAge: (community.minAge !== undefined) ? +community.minAge : -1,
      maxAge: (community.maxAge !== undefined) ? +community.maxAge : -1,
      gender: gender[community.gender] ? gender[community.gender] : gender.undefined,
      type: type[community.type] ? type[community.type]: type.public
    };
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isValid (community) {
    var output;
    if (!(output = isValidName(community.name))) {
      return output;
    } else if (!(output = isValidDescription(community.description))) {
      return output;
    } else if (community.status && status[community.status] === undefined) {
      return Errors.badInput('community.status',community.status);
    } else if (community.gender && gender[community.gender] === undefined) {
      return Errors.badInput('community.gender',community.gender);
    } else if (community.type && type[community.type] === undefined) {
      return Errors.badInput('community.type',community.type);
    } else if (community.minAge !== undefined && community.maxAge !== undefined &&
               community.minAge > -1 && community.maxAge > -1 &&
               community.minAge > community.maxAge) {
      return Errors.badInput('community.minAge',community.minAge);
    } else {
      return true;
    }
  }

  function isValidName (name) {
    var output = validators.isValidStringLength('community.name', name, minNameLen, maxNameLen, true)
    if (output === true) {
      output = validators.isValidEntityName(name);
    }
    return output;
  }

  function isValidDescription (description) {
    return validators.isValidStringLength('community.description', description, minDescriptionLen, maxDescriptionLen, false);
  }

})();