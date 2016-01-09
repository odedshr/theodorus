;(function MembershipClosure() {
    'use strict';
    var Community = require ('./Communities.js');
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
            join: membership.join,
            endorseJoin: membership.endorseJoin,
            endorseGender: membership.endorseGender,
            endorseMinAge: membership.endorseMinAge,
            endorseMaxAge: membership.endorseMaxAge,
            community: membership.community ? membership.community.toJSON() : undefined,
            communityId: Encryption.mask(membership.communityId)
        };
    }

    function toList (list) {
        var members = [];
        var i, listLength = list.length;
        for (i=0;i<listLength;i++) {
            var membership = list[i];
            members.push({
                id: Encryption.mask(membership.id),
                status: membership.status,
                name: membership.name,
                email: membership.email,
                description: membership.description,
                score: membership.score,
                isModerator: membership.isModerator,
                isPublic: membership.isPublic,
                isRepresentative: membership.isRepresentative
            });
        }
        return members;
    }

    function toMap (list) {
        var members = toList(list);
        var map = {};
        while (members.length) {
            var member = members.pop();
            map[member.id] = member;
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
            join: Object.keys(Community.join),
            endorseJoin: Object.keys(Community.join),
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
                return (this.permissions[action] !== undefined);
            },

            toJSON:function thisToJSON() { return toJSON(this); }
        },
        validations: {},
        manualFields: ['status','name','description','isModerator', 'isPublic','isPublic','isRepresentative','endorseJoin','endorseGender','endorseMinAge','endorseMaxAge'],
        toJSON: toJSON,
        toList: toList,
        toMap: toMap,
        getNew: function getNew (membershipId, userId, communityId, email, join, iStatus) {
            var now = new Date ();
            return {
                id : membershipId,
                status: status[iStatus] ? status[iStatus] : status.active,
                created: now,
                modified: now,
                userId : userId,
                communityId: communityId,
                email: email,
                score: 0,
                permissions: { 'suggest': true, 'opinionate': true, 'comment':true, 'approve-members': true, 'invite-members': true },
                penalties: {},
                isModerator: false,
                isPublic: false,
                isRepresentative: false,
                join: join
            };
        }
    };

})();