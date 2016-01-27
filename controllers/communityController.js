;(function communityRoutesEnclosure() {
    'use strict';
    var chain = require('../helpers/chain.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var Encryption = require('../helpers/Encryption.js');
    var Errors = require('../helpers/Errors.js');
    var validators = require('../helpers/validators.js');
    var membershipController = require('../controllers/membershipController');

    function add (authUser, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join, founderName, db, callback) {
        var community = db.community.model.getNew(undefined, authUser.id, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join);
        var founder = db.membership.model.getNew(undefined, authUser.id, undefined, authUser.email, community.join, undefined);
        founder.name = founderName;
        validateValues(community, founder, valuesValidated.bind(null, db, callback), callback);
    }

    function archive (authUser, communityId, db, callback) {
        update( authUser, { id: communityId, status: db.community.model.status.archived }, db, callback );
    }

    function update (authUser, communityId, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join,  db, callback) {
        var community = db.community.model.getNew(Encryption.unmask(communityId), authUser.id, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, join);
        validateValues(community, valuesValidated.bind(null, db, callback), callback);
    }

    function validateValues (community, founder, onSuccess, onError) {
        if (validators.isValidCommunityName(community.name)) {
            //TODO: validate founderId == communityFounderId
            onSuccess(community, founder);
        } else {
            onError (Errors.badInput('community.name',community.name));
        }
    }

    function valuesValidated (db,callback, community, founder) {
        if (community.id !== undefined && +community.id > 0) {
            //TODO: validate founderId == communityFounderId
            db.community.get(community.id, editValues.bind(null, founderName, db, callback, community));
        } else if (community.founderId !== undefined && +community.founderId > 0) {
            var dCommunity = db.community.model.getNew();
            editValues(founder, db, callback, community, undefined, dCommunity);
        } else {
            callback (new Error('community-must-have-founder'));
        }
    }

    function editValues(founder, db, callback, jCommunity,error,dCommunity) {
        tryCatch( function tryCatchEditValues () {
            if (error) {
                callback (new Error(error));
            } else if (dCommunity) {
                setValues(dCommunity, jCommunity);
                if (dCommunity.id) {
                    dCommunity.save(chain.onSaved.bind(null, callback));
                } else {
                    db.community.create(dCommunity, onCommunityAdded.bind(null, founder, db, callback));
                }
            } else {
                callback (new Error(409));
            }
        }, function (err) {
            callback(err);
        });
    }

    function onCommunityAdded (founder, db, callback, err, community) {
        if (err) {
            callback(new Error(err));
        } else {
            founder.communityId = community.id;
            db.membership.create(founder, onFounderAdded.bind(null, community, callback));
        }
    }

    function onFounderAdded (community, callback, err, founder) {
        if (err) {
            callback(new Error(err));
        } else {
            var jCommunity = community.toJSON();
            jCommunity.membership = founder.toJSON();
            callback(jCommunity);
        }
    }

    function setValues (dCommunity, jCommunity) {
        if (jCommunity.founderId !== jCommunity.undefined) {
            dCommunity.founderId = jCommunity.founderId;
        }
        if (jCommunity.name !== jCommunity.undefined) {
            dCommunity.name = jCommunity.name;
        }
        if (jCommunity.status !== jCommunity.undefined) {
            dCommunity.status = jCommunity.status;
        }
        if (jCommunity.description !== jCommunity.undefined) {
            dCommunity.description = jCommunity.description;
        }
        if (jCommunity.topicLength !== jCommunity.undefined) {
            dCommunity.topicLength = jCommunity.topicLength;
        }
        if (jCommunity.opinionLength !== jCommunity.undefined) {
            dCommunity.opinionLength = jCommunity.opinionLength;
        }
        if (jCommunity.commentLength !== jCommunity.undefined) {
            dCommunity.commentLength = jCommunity.commentLength;
        }
        if (jCommunity.minAge !== jCommunity.undefined) {
            dCommunity.minAge = jCommunity.minAge;
        }
        if (jCommunity.maxAge !== jCommunity.undefined) {
            dCommunity.maxAge = jCommunity.maxAge;
        }
        if (jCommunity.gender !== jCommunity.undefined) {
            dCommunity.gender = jCommunity.gender;
        }
        if (jCommunity.join !== jCommunity.undefined) {
            dCommunity.join = jCommunity.join;
        }
        if (jCommunity.modified !== jCommunity.undefined) {
            dCommunity.modified = jCommunity.modified;
        }
    }

    function get (optionalUser, communityId, db, callback) {
        db.community.get(Encryption.unmask(communityId), onGotCommunity.bind(null, optionalUser, db, callback));
    }
    function onGotCommunity (optionalUser, db, callback, err, community) {
        if (optionalUser !== undefined) {
            db.membership.one({userId: optionalUser.id, communityId: community.id}, onGotCommunityMember.bind(null, callback, community));
        } else {
            callback(err ? err : community.toJSON());
        }
    }
    function onGotCommunityMember (callback, community, err, member) {
        var jCommunity = community.toJSON();
        if (member !== null) {
            jCommunity.membership = member.toJSON();
        }
        callback(jCommunity);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function list (optionalUser, db, callback) {
        var tasks = [{name:'communities', table:db.community, parameters: { status: db.community.model.status.active }, multiple: {} }];
        if (optionalUser !== undefined) {
            tasks.push ({name:'memberships', table:db.membership, parameters: { userId: optionalUser.id }, multiple: {} });
        }
        chain (tasks, listOnDataLoaded.bind(null, callback), callback);
    }


    function listOnDataLoaded (callback, data) {
        var dMemberships = data.memberships;
        var dCommunities = data.communities;
        var communityCount = dCommunities.length;
        var jCommunities = [];
        var communityMap = {};
        var community, membership;
        for (var i = 0; i < communityCount; i++) {
            community = dCommunities[i].toJSON();
            communityMap[community.id] = community;
            jCommunities.push(community);
        }
        if (dMemberships !== undefined) {
            var membershipsCount = dMemberships.length;
            while (membershipsCount--) {
                membership = dMemberships[membershipsCount];
                community = communityMap[Encryption.mask(membership.communityId)];
                community.membershipId = Encryption.mask(membership.id);
                community.membershipStatus = membership.status;
                community.membershipName = membership.name;
            }
        }
        callback(jCommunities);
    }

    module.exports.add = add;
    module.exports.update = update;
    module.exports.get = get;
    module.exports.list = list;
    module.exports.archive = archive;
})();