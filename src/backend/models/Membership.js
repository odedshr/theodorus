;(function MembershipClosure() {
  'use strict';

  var Community = require ('./Community.js');
  var Errors = require ( '../helpers/Errors.js' );
  var modelUtils = require ( '../helpers/modelUtils.js' );
  var validators = require ( '../helpers/validators.js' );

  var status = modelUtils.toEnum(['invited', 'requested', 'declined','rejected','active','unfit', 'quit','archived']);
  var defaultPermissions = { 'read':true,
                              'endorse':true,
                              'follow':true,
                              'suggest': true,
                              'opinionate': true,
                              'comment':true,
                              'approve-members': true,
                              'invite-members': true
                            };
  var editableFields = ['name','description','isModerator', 'isPublic','isPublic','isRepresentative','endorseJoin','endorseGender','endorseMinAge','endorseMaxAge', 'hasImage'];
  var jsonMinimalFields = ['communityId','description','isModerator','isPublic','isRepresentative','hasImage','id',
    'name','score','status','created'];
  var jsonFields = ['id','status','created','modified','name','description','score','birthDate','permissions',
    'penalties','isModerator','isPublic','isRepresentative','hasImage','communityType','endorseCommunityType',
    'endorseGender','endorseMinAge','endorseMaxAge','communityId'];

  var minNameLen = 1;
  var maxNameLen = 15;
  var minDescriptionLen = 1;
  var maxDescriptionLen = 140;

  module.exports = {
    name: 'membership',
    status: status,
    schema: {
      id: { type: 'text', key: true },
      status: Object.keys(status),
      created: Date,
      modified: Date,
      name: String,
      description: String,
      hasImage: Boolean,
      birthDate: Date,
      permissions: Object,
      penalties: Object,
      isModerator: Boolean,
      isPublic: Boolean,
      isRepresentative: Boolean,
      endorseCommunityType: Object.keys(Community.type),
      endorseGender: Object.keys(Community.gender),
      endorseMinAge: { type: 'integer' },
      endorseMaxAge: { type: 'integer' },
      score: Number,
      scoreDate: Date

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
      isValid: function () {
        return isValid(this);
      },
      toJSON: function (isMinimal) {
        return modelUtils.toJSON(this, isMinimal ? jsonMinimalFields : jsonFields);
      },
      getEditables: modelUtils.simplyReturn.bind({},editableFields)
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
        description: membership.description,
        score: 0,
        permissions: defaultPermissions,
        penalties: {},
        hasImage: membership.hasImage || false,
        isModerator: false,
        isPublic: false,
        isRepresentative: false
      };
    }
  };


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isValid (membership) {
    var output;
    if (!(output = isValidName(membership.name))) {
      return output;
    } else if (!(output = isValidDescription(membership.description))) {
      return output;
    } else if (status[membership.status] === undefined) {
      return Errors.badInput('membership.status',membership.status);
    } else if (membership.communityId === undefined) {
      return Errors.missingInput('membership.communityId');
    } else if (membership.userId === undefined) {
      return Errors.missingInput('membership.userId');
    } else{
      return true;
    }
  }

  function isValidName (name) {
    var output = validators.isValidStringLength('membership.name', name, minNameLen, maxNameLen, true);
    if (output === true) {
      output = validators.isValidEntityName('membership.name', name);
    }
    return output;
  }

  function isValidDescription (description) {
    return validators.isValidStringLength('membership.description', description, minDescriptionLen, maxDescriptionLen, false);
  }
})();