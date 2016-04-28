;(function communityModelClosure() {
  'use strict';
  var Encryption = require ( '../helpers/Encryption.js' );
  var Errors = require ( '../helpers/Errors.js' );
  var validators = require ( '../helpers/validators.js' );

  var status = { active: 'active', suspended: 'suspended', archived: 'archived'};
  var gender = { male: 'male', female: 'female', neutral: 'neutral'};
  var type = { public: 'public', exclusive: 'exclusive', secret: 'secret'};

  var editableFields = ['name','description','topicLength', 'opinionLength','commentLength','minAge','maxAge','gender','type'];

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
        return isPostLengthOK(message, this.topicLength);
      },
      isOpinionLengthOk: function isOpinionLengthOk (message) {
        return isPostLengthOK(message, this.opinionLength);
      },
      isCommentLengthOk: function isCommentLengthOk (message) {
        return isPostLengthOK(message, this.commentLength);
      },
      isValid: function () {
        return isCommunityValid(this);
      },
      toJSON: function (isMinimal) {
        return toJSON(this, isMinimal);
      },
      getEditables: getEditables
    },
    validations: {},
    status : status,
    gender : gender,
    type : type,
    getNew: function getNew ( community) {
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
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function toJSON (community, isMinimal) {
    return isMinimal ? {
      id: community.id,
      name: community.name,
      description: community.description,
      members: community.members,
      topics: community.topics,
      type: community.type
    } :{
      id: community.id,
      status: community.status,
      created: community.created,
      modified: community.modified,
      name: community.name,
      description: community.description,
      founderId: community.founderId,
      members: community.members,
      topicLength: community.topicLength,
      opinionLength: community.opinionLength,
      commentLength: community.commentLength,
      minAge: community.minAge,
      maxAge: community.maxAge,
      gender: community.gender,
      type: community.type,
      topics: community.topics
    };
  }

  function getEditables () {
    return editableFields;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isPostLengthOK (message, comparedTo) {
    if (comparedTo === 0) {
      return true;
    } else {
      var stringSize = comparedTo > 0 ? validators.countWords(message) : validators.countCharacters(message);
      return stringSize <= Math.abs(comparedTo);
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