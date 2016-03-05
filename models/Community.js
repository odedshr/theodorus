;(function communityModelClosure() {
    'use strict';
    var Encryption = require ( '../helpers/Encryption.js' );
    var validators = require ( '../helpers/validators.js' );

    var status = { active: "active", suspended: "suspended", archived: "archived"};
    var gender = { male: "male", female: "female", neutral: "neutral"};
    var type = { public: "public", exclusive: "exclusive", secret: "secret"};

    function toJSON (community) {
        return {
            id: Encryption.mask(community.id),
            status: community.status,
            created: community.created,
            modified: community.modified,
            name: community.name,
            description: community.description,
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

    function isPostLengthOK (message, comparedTo) {
        if (comparedTo === 0) {
            return true;
        } else {
            return (comparedTo > 0 ? validators.countWords(message) : validators.countCharacters(message)) <= Math.abs(comparedTo);
        }
    }
    module.exports = {
        name: 'community',
        schema: {
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
            model.hasOne('founder',models.membership, { field: 'founderId', required: true});
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
            toJSON: function () {
                return toJSON(this);
            }
        },
        validations: {},
        status : status,
        gender : gender,
        type : type,
        toJSON: toJSON,
        getNew: function getNew (communityId, founderId, name, description, iStatus, topicLength, opinionLength, commentLength, minAge, maxAge, iGender, iType) {
            var now = new Date ();
            return {
                id : communityId,
                founderId : founderId,
                name: name,
                description: description,
                topics: 0,
                members: 1, // at least the founder is a member
                status: status[iStatus] ? status[iStatus] : status.active,
                created: now,
                modified: now,
                topicLength: (topicLength !== undefined) ? +topicLength : -140,
                opinionLength: (opinionLength !== undefined) ? +opinionLength : -140,
                commentLength: (commentLength !== undefined) ? +commentLength : 100,
                minAge: (minAge !== undefined) ? +minAge : -1,
                maxAge: (maxAge !== undefined) ? +maxAge : -1,
                gender: gender[iGender] ? gender[iGender] : gender.neutral,
                type: type[iType] ? type[iType]: type.public
            };
        }
    };

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