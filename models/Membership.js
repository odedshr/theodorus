;(function MembershipClosure() {
  'use strict';
  var Community = require ('./Community.js');
  var Encryption = require ( '../helpers/Encryption.js' );

  var status =  { invited: "invited", requested: "requested",declined: "declined", "rejected": "rejected", active: "active", unfit: "unfit", quit: "quit", archived: "archived"};

  function toJSON (membership) {
    return {
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
      community: membership.community ? membership.community.toJSON() : undefined,
      communityId: Encryption.mask(membership.communityId)
    };
  }

  function toMinJSON (membership) {
    return {
      id: Encryption.mask(membership.id),
      status: membership.status,
      name: membership.name,
      email: membership.email,
      description: membership.description,
      score: membership.score,
      isModerator: membership.isModerator,
      isPublic: membership.isPublic,
      isRepresentative: membership.isRepresentative
    }
  }
  function toList (list) {
    var members = [];
    var i, listLength = list.length;
    for (i=0;i<listLength;i++) {
      members[members.length] = toMinJSON (list[i]);
    }
    return members;
  }

  function toMap (list) {
    var count = list.length;
    var map = {};
    while (count--) {
      var member = list[count];
      map[member.id] = toMinJSON (member);
    }
    return  map;
  }

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

      toJSON:function thisToJSON() { return toJSON(this); }
    },
    validations: {},
    manualFields: ['status','name','description','isModerator', 'isPublic','isPublic','isRepresentative','endorseJoin','endorseGender','endorseMinAge','endorseMaxAge'],
    toJSON: toJSON,
    toList: toList,
    toMap: toMap,
    getNew: function getNew (membershipId, userId, communityId, name, email, communityType, iStatus) {
      var now = new Date ();
      return {
        id : membershipId,
        status: status[iStatus] ? status[iStatus] : status.active,
        created: now,
        modified: now,
        userId : userId,
        communityId: communityId,
        name: name,
        email: email,
        score: 0,
        permissions: { 'read':true,'endorse':true,'follow':true, 'suggest': true, 'opinionate': true, 'comment':true, 'approve-members': true, 'invite-members': true },
        penalties: {},
        isModerator: false,
        isPublic: false,
        isRepresentative: false,
        communityType: communityType
      };
    }
  };

})();