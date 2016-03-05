;(function communityRoutesEnclosure() {
    'use strict';
    var chain = require('../helpers/chain.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var Encryption = require('../helpers/Encryption.js');
    var Errors = require('../helpers/Errors.js');
    var validators = require('../helpers/validators.js');
    var membershipController = require('../controllers/membershipController');

    function add (authUser, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, type, founderName, db, callback) {
        var community = db.community.model.getNew(undefined, authUser.id, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, type);
        var founder = db.membership.model.getNew(undefined, authUser.id, undefined, authUser.email, community.type, undefined);
        founder.name = founderName;
        validateValues(community, founder, valuesValidated.bind(null, db, callback), callback);
    }

    function archive (authUser, communityId, db, callback) {
        update( authUser, { id: communityId, status: db.community.model.status.archived }, db, callback );
    }

    function update (authUser, communityId, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, type,  db, callback) {
        var community = db.community.model.getNew(Encryption.unmask(communityId), authUser.id, name, description, status, topicLength, opinionLength, commentLength, minAge, maxAge, gender, type);
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
            db.community.get(community.id, editValues.bind(null, founder.name, db, callback, community));
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
                    dCommunity.save(chain.onSaved.bind(null, onCommunityUpdated.bind(null,callback)));
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

    function onCommunityUpdated (callback, community) {
        if (community instanceof Error) {
            callback(community);
        } else {
            callback(community.toJSON());
        }
    }

    function onCommunityAdded (founder, db, callback, err, community) {
        if (err) {
            callback(new Error(err));
        } else {
            founder.communityId = community.id;
            db.membership.create(founder, chain.onSaved.bind(null, onFounderAdded.bind(null, community, callback)));
        }
    }

    function onFounderAdded (community, callback, founder) {
        if (founder instanceof Error) {
            callback(founder);
        } else {
            var jCommunity = community.toJSON();
            jCommunity.membership = founder;
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
        if (jCommunity.type !== jCommunity.undefined) {
            dCommunity.type = jCommunity.type;
        }
        if (jCommunity.modified !== jCommunity.undefined) {
            dCommunity.modified = jCommunity.modified;
        }
    }

    function get (optionalUser, communityId, db, callback) {
        var unmaskedCommunityId = Encryption.unmask(communityId);
        if (isNaN(unmaskedCommunityId)) {
            callback(Errors.badInput('communityId',communityId));
        } else {
            var tasks = [{name:'community', table:db.community, parameters: unmaskedCommunityId, continueIf: chain.onlyIfExists }];
            if (optionalUser !== undefined) {
                tasks.push ({name:'membership', table:db.membership, parameters: {userId: optionalUser.id, communityId: unmaskedCommunityId }});
            }
            chain (tasks, getOnDataLoaded.bind(null, callback), callback);
        }
    }

    function getOnDataLoaded (callback, data) {
        var jCommunity = data.community.toJSON();
        if (data.membership) {
            jCommunity.membership = data.membership.toJSON();
        }
        callback(jCommunity);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function list (optionalUser, db, callback) {
        var communityModel = db.community.model;
        var tasks = [{name:'communities', table:db.community, parameters: { and: [ { status: communityModel.status.active }, { type : [ communityModel.type.public, communityModel.type.exclusive ]}] }, multiple: {} }];
        if (optionalUser !== undefined) {
            tasks.push ({name:'memberships', table:db.membership, parameters: { userId: optionalUser.id }, multiple: {} });
        }
        chain (tasks, listOnDataLoaded.bind(null, communityModel, callback), callback);
    }


    function listOnDataLoaded (communityModel, callback, data) {
        var validCommunityTypes = [communityModel.type.public, communityModel.type.exclusive];
        var community, membership;
        var dMemberships = data.memberships;
        var dCommunities = data.communities;
        var joinedCommunities = [];
        var communityCount = dCommunities.length;
        var jCommunities = [];

        if (dMemberships !== undefined) {
            var membershipsCount = dMemberships.length;
            while (membershipsCount--) {
                membership = dMemberships[membershipsCount];
                joinedCommunities[membership.communityId] = membership;
            }
        }

        for (var i = 0; i < communityCount; i++) {
            var dCommunity = dCommunities[i];
            community = dCommunity.toJSON();
            membership = joinedCommunities[dCommunity.id];
            // include community only if public or exclusive, or if user is a member
            if (validCommunityTypes.indexOf(community.type) > -1 || joinedCommunities[dCommunities[i].id] === true) {
                jCommunities.push(community);
                if (joinedCommunities[dCommunities[i].id] === true) {
                    community.membershipId = Encryption.mask(membership.id);
                    community.membershipStatus = membership.status;
                    community.membershipName = membership.name;
                }
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