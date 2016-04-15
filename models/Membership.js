;(function MembershipClosure() {
  'use strict';
  var Community = require ('./Community.js');
  var Encryption = require ( '../helpers/Encryption.js' );
  var Errors = require ( '../helpers/Errors.js' );

  var status =  { invited: "invited", requested: "requested",declined: "declined", "rejected": "rejected", active: "active", unfit: "unfit", quit: "quit", archived: "archived"};
  var defaultPermissions = { 'read':true,'endorse':true,'follow':true, 'suggest': true, 'opinionate': true, 'comment':true, 'approve-members': true, 'invite-members': true };
  var editableFields = ['name','description','isModerator', 'isPublic','isPublic','isRepresentative','endorseJoin','endorseGender','endorseMinAge','endorseMaxAge'];

  module.exports = {
    name: 'membership',
    status: status,
    schema: {
      status: Object.keys(status),
      created: Date,
      modified: Date,
      name: String,
      email: String,
      description: String,
      score: Number,
      birthDate: Date,
      permissions: Object,
      penalties: Object,
      isModerator: Boolean,
      isPublic: Boolean,
      isRepresentative: Boolean,
      communityType: Object.keys(Community.type),
      endorseCommunityType: Object.keys(Community.type),
      endorseGender: Object.keys(Community.gender),
      endorseMinAge: Number,
      endorseMaxAge: Number

    },
    relations: function (model, models) {
      model.hasOne('user',models.user, { field: 'userId' });
      model.hasOne('community',models.community, { field: 'communityId', required: true});
      model.hasOne('approver',models.membership, { field: 'approverId'});
    },
    methods : {
      can: function(action) {
        //TODO: check if has penalties
        return (this.permissions && this.permissions[action] !== undefined);
      },

      toJSON:function thisToJSON(isMinimal) { return toJSON(this, isMinimal); },
      getEditables: getEditables
    },
    validations: {},
    toJSON: toJSON,
    isValid: isValid,
    isValidName: isValidName,
    getNew: function getNew ( membership ) {
      var now = new Date ();
      return {
        id : membership.id,
        status: status[membership.status] ? status[membership.status] : status.active,
        created: now,
        modified: now,
        userId : membership.userId,
        communityId: membership.communityId,
        name: membership.name,
        email: membership.email,
        score: 0,
        permissions: defaultPermissions,
        penalties: {},
        isModerator: false,
        isPublic: false,
        isRepresentative: false,
        communityType: membership.communityType
      };
    }
  };

  function toJSON (membership, isMinimal) {
    return isMinimal ? {
      id: Encryption.mask(membership.id),
      status: membership.status,
      name: membership.name,
      email: membership.email,
      description: membership.description,
      score: membership.score,
      isModerator: membership.isModerator,
      isPublic: membership.isPublic,
      isRepresentative: membership.isRepresentative
    } : {
      id: Encryption.mask(membership.id),
      status: membership.status,
      created: membership.created,
      modified: membership.modified,
      name: membership.name,
      email: membership.email,
      description: membership.description,
      score: membership.score,
      birthDate: membership.birthDate,
      permissions: membership.permissions,
      penalties: membership.penalties,
      isModerator: membership.isModerator,
      isPublic: membership.isPublic,
      isRepresentative: membership.isRepresentative,
      communityType: membership.communityType,
      endorseCommunityType: membership.endorseCommunityType,
      endorseGender: membership.endorseGender,
      endorseMinAge: membership.endorseMinAge,
      endorseMaxAge: membership.endorseMaxAge,
      communityId: Encryption.mask(membership.communityId)
    };
  }

  function getEditables () {
    return editableFields;
  }

  function isValidName ( string ) {
    if (string === undefined || string.length === 0) {
      return Errors.tooShort('membership.name', string);
    }
    return true;
  }

  function isValid ( membership ) {
    var  nameIsValid = isValidName (membership.name);
    if (nameIsValid !== true) {
      return nameIsValid;
    }
    if (membership.communityId === undefined) {
      return Errors.missingInput('membership.communityId');
    }
    return true;
  }
})();