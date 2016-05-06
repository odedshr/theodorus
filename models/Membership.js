;(function MembershipClosure() {
  'use strict';
  var Community = require ('./Community.js');
  var Encryption = require ( '../helpers/Encryption.js' );
  var Errors = require ( '../helpers/Errors.js' );
  var utils = require ( '../helpers/modelUtils.js' );

  var status =  { invited: "invited", requested: "requested",declined: "declined", "rejected": "rejected", active: "active", unfit: "unfit", quit: "quit", archived: "archived"};
  var defaultPermissions = { 'read':true,'endorse':true,'follow':true, 'suggest': true, 'opinionate': true, 'comment':true, 'approve-members': true, 'invite-members': true };
  var editableFields = ['name','description','isModerator', 'isPublic','isPublic','isRepresentative','endorseJoin','endorseGender','endorseMinAge','endorseMaxAge'];
  var jsonMinimalFields = ['communityId','description','isModerator','isPublic','isRepresentative','hasImage','id',
    'name','score','status'];
  var jsonFields = ['id','status','created','modified','name','description','score','birthDate','permissions',
    'penalties','isModerator','isPublic','isRepresentative','hasImage','communityType','endorseCommunityType',
    'endorseGender','endorseMinAge','endorseMaxAge','communityId'];

  module.exports = {
    name: 'membership',
    status: status,
    schema: {
      id: {type: 'text', key: true},
      status: Object.keys(status),
      created: Date,
      modified: Date,
      name: String,
      description: String,
      hasImage: Boolean,
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

      toJSON: function (isMinimal) {
        return utils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: utils.simplyReturn.bind({},editableFields)
    },
    validations: {},
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
        score: 0,
        permissions: defaultPermissions,
        penalties: {},
        hasImage: false,
        isModerator: false,
        isPublic: false,
        isRepresentative: false,
        communityType: membership.communityType
      };
    }
  };

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