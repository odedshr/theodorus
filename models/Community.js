;(function communityModelClosure() {
  /*jshint validthis: true */
  'use strict';

  var Encryption = require ( '../helpers/Encryption.js' );
  var Errors = require ( '../helpers/Errors.js' );
  var utils = require ( '../helpers/modelUtils.js' );
  var validators = require ( '../helpers/validators.js' );

  var status = { active: 'active', suspended: 'suspended', archived: 'archived'};
  var gender = { male: 'male', female: 'female', neutral: 'neutral'};
  var type = { public: 'public', exclusive: 'exclusive', secret: 'secret'};

  var editableFields = ['name','description','topicLength', 'opinionLength','commentLength','minAge','maxAge','gender','type'];
  var jsonMinimalFields = ['id','name','description','members','topics','type'];
  var jsonFields = ['id','status','created','modified','name','description','founderId','members','topicLength','opinionLength','commentLength','minAge','maxAge','gender','type','topics'];

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports = {
    name: 'community',
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      name: String,
      description: String,
      members: { type: 'integer' },
      topicLength: Number,  //xx>0 words, xx<0 characters, 0=no limit
      opinionLength: Number,  //xx>0 words, xx<0 characters, 0=no limit
      commentLength: Number, //xx>0 words, xx<0 characters, 0=no limit
      minAge: { type: 'integer' },
      maxAge: { type: 'integer' },
      gender: Object.keys(gender),
      type: Object.keys(type),
      topics: Number
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
        if (this.gender && this.gender !== gender.neutral) {
          value = value && ((user.isFemale && this.gender === gender.female) || (!user.isFemale && this.gender === gender.male));
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
        return isCommunityValid(this);
      },
      toJSON: function (isMinimal) {
        return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: utils.simplyReturn.bind({},editableFields)
    },
    validations: {},
    status : status,
    gender : gender,
    type : type,
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
      gender: gender[community.gender] ? gender[community.gender] : gender.neutral,
      type: type[community.type] ? type[community.type]: type.public
    };
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isPostLengthOK (message, compareTo) {
    if (compareTo === 0) {
      return true;
    } else {
      var stringSize = compareTo > 0 ? validators.countWords(message) : validators.countCharacters(message);
      return stringSize <= Math.abs(compareTo);
    }
  }

  //------------------------------------------------------------------------------------------------------------//

  function isCommunityValid (community) {
    return isValidCommunityName(community.name);
  }

  function isValidCommunityName (name) {
    if (name === undefined) {
      return Errors.missingInput('name');
    }
    if (name === 0) {
      return Errors.tooShort('name');
    }
    return true;
  }

})();

/*
 *
 * * Community
 - User can belong to one or more communities
 - A community can be visible to all or to members-only
 - Joining a community can be limited to invitation-only, invitation and/or request, free for all
 - User can create their own communities
 - Community has a name, a description and a logo
 - Community can decide whether permissions and penalties are visible or private
 * */