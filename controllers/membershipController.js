;(function membershipControllerEnclosure() {
    'use strict';

    var Encryption = require ('../helpers/Encryption.js');
    var Errors = require('../helpers/Errors.js');
    var tryCatch = require('../helpers/tryCatch.js');
    var chain = require('../helpers/chain.js');

    function add (authUser, email, communityId, db, callback) {
        db.community.get(Encryption.unmask(communityId), chain.onLoad.bind(null, 'community', addOnCommunityLoaded.bind(null,db, callback, email, authUser), callback, true));
    }

    function addOnCommunityLoaded (db, callback, email, authUser, community) {
        if (email === undefined) {
            email = authUser.email;
        }
        db.membership.one({email: email, communityId: community.id}, onMembershipLoaded.bind(null, db, callback, authUser, community,email));
    }

    function onMembershipLoaded (db, callback, authUser, community, email, error, membership) {
        if (error) {
            callback(new Error('failed-to-load-membership'));
        } else if (membership) {
            addOnMembershipAlreadyExists (db, callback, authUser, community, membership);
        } else {
            membership = db.membership.model.getNew(undefined, (authUser.email === email ? authUser.id : undefined), community.id, email, community.join, undefined);
            addOnMembershipNotExists (db, callback, authUser, community, membership);
        }
    }

    function addOnMembershipAlreadyExists (db, callback, authUser, community, dMembership) {
        if (dMembership.status === db.membership.model.status.requested || dMembership.status === db.membership.model.status.invited) {
            dMembership.created = new Date();
        }
        switch (dMembership.status) {
            case db.membership.model.status.requested:
            case db.membership.model.status.declined:
                if (dMembership.email !== authUser.email) {
                    db.membership.one({userId: authUser.id, communityId: community.id}, chain.onLoad.bind(null, 'membership', addOnApproverLoaded.bind(null, db, callback, dMembership, community), callback, true));
                } else {
                    callback(new Error('cannot-approve-yourself'));
                }
                break;
            case db.membership.model.status.invited:
            case db.membership.model.status.rejected:
                if (dMembership.email === authUser.email) {
                    db.user.one({email: authUser.email}, chain.onLoad.bind(null, 'user',addOnRequesterUserLoaded.bind(null, db, callback, dMembership, community), callback, true));
                } else if (dMembership.approverId === authUser.id) {
                    callback(new Error('only-invited-can-accept-invitation'));
                } else {
                    callback(new Error('already-invited'));
                }
                break;
            case db.membership.model.status.unfit:
                //TODO: re-asses unfits
                break;
            case db.membership.model.status.active:
                callback (new Error(409));
                break;
            default:
                callback (new Error(409));
                break;
        }
    }
    function addOnApproverLoaded (db, callback, dMembership, community, approver) {
        if (approver.status === db.membership.model.status.active && approver.can ('approve-members')) {
            dMembership.approverId = approver.id;
            db.user.get(dMembership.userId, chain.onLoad.bind(null, 'user', addOnRequesterUserLoaded.bind(null, db, callback, dMembership, community), callback, true));
        } else {
            callback(Errors.noPermissions('approve-members'));
        }
    }
    function addOnRequesterUserLoaded (db, callback, dMembership, community, requesterUser) {
        dMembership.status = community.isFit(requesterUser) ? db.membership.model.status.active  : db.membership.model.status.unfit;
        dMembership.modified = new Date();
        dMembership.save(chain.onSaved.bind(null, callback));
    }
    function addOnMembershipNotExists (db, callback, authUser, community, jMembership) {
        if (authUser.email !== jMembership.email && (community.join === db.community.model.join.open || community.join === db.community.model.join.invite )) {
            db.membership.one({userId: authUser.id, communityId: community.id}, chain.onLoad.bind(null, 'membership', addOnInviterLoaded.bind(null, db, callback, jMembership), callback, true));
        } else if (community.founderId === authUser.id) {
            jMembership.join = db.community.model.join.open;
            db.membership.create(jMembership, chain.onSaved.bind(null, callback));
        } else {
            db.user.get(authUser.id, chain.onLoad.bind(null,'user', addOnUserLoaded.bind(null,db, callback,community, jMembership), callback, true));
        }
    }
    function addOnUserLoaded (db, callback,community, jMembership, user) {
        if (community.isFit(user)) {
            switch (community.join) {
                case db.community.model.join.request:
                    jMembership.join = db.community.model.join.request;
                    jMembership.status = db.membership.model.status.requested;
                    db.membership.create(jMembership, chain.onSaved.bind(null, callback));
                    break;
                case db.community.model.join.open:
                    jMembership.join = db.community.model.join.open;
                    db.membership.create(jMembership, chain.onSaved.bind(null, callback));
                    break;
                case db.community.model.join.invite:
                    callback(new Error('cannot-join-invite-only-community'));
                    break;
                default:
                    callback(new Error('community-with-no-join-definition'));
                    break;
            }
        } else {
            callback(new Error('user-not-fit-for-community'));
        }
    }
    function addOnInviterLoaded (db, callback, jMembership, inviter) {
        if (inviter.status === db.membership.model.status.active && inviter.can('invite-members')) {
            jMembership.approverId = inviter.id;
            jMembership.status = db.membership.model.status.invited;
            db.membership.create(jMembership, chain.onSaved.bind(null, callback));

        } else {
            callback(Errors.noPermissions('invite-members'));
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function reject (authUser, membershipId, db, callback) {
        db.membership.get(Encryption.unmask(membershipId), chain.onLoad.bind(null, 'membership', rejectOnMembershipLoaded.bind(null,db, callback, authUser), callback, true));
    }

    function rejectOnMembershipLoaded (db, callback, authUser, membership) {
        if (membership.status === db.membership.model.status.requested || membership.status === db.membership.model.status.rejected) {
            db.membership.one({userId: authUser.id, communityId: membership.communityId }, chain.onLoad.bind(null, 'user', rejectOnUserLoaded.bind(null, db, callback, membership), callback, true));
        } else {
            ccallback(Errors.badInput('status',membership.status));
        }
    }

    function rejectOnUserLoaded (db, callback, membership, approver) {
        if (approver.status === db.membership.model.status.active && approver.can('approve-members')) {
            membership.status = db.membership.model.status.rejected;
            membership.approverId = approver.id;
            membership.modifed = new Date();
            membership.save(chain.onSaved.bind(null, callback));
        } else {
            callback(Errors.noPermissions('approve-members'));
        }
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function decline (membershipId , db, callback) {
        db.membership.get(Encryption.unmask(Encryption.decode(membershipId)), chain.onLoad.bind(null, 'membership', declineOnMembershipLoaded.bind(null, db, callback), callback, true));
    }

    function declineOnMembershipLoaded (db, callback, membership) {
        if (membership.status === db.membership.model.status.invited) {
            membership.status = db.membership.model.status.declined;
            membership.modifed = new Date();
            membership.save(chain.onSaved.bind(null, callback));
        } else {
            callback(Errors.badInput('status',membership.status));
        }
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function quit (authUser, communityId , db, callback) {
        db.membership.one({userId: authUser.id, communityId: Encryption.unmask(communityId)}, chain.onLoad.bind(null, 'membership', quitOnMembershipLoaded.bind(null, db, callback), callback, true));
    }

    function quitOnMembershipLoaded (db, callback, membership) {
        if (membership.status === db.membership.model.status.active) {
            membership.status = db.membership.model.status.quit;
            membership.modifed = new Date();
            membership.save(chain.onSaved.bind(null, callback));
        } else {
            callback(Errors.badInput('status',membership.status));
        }
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function update (authUser, membership , db, callback) {
        if (membership && membership.id) {
            db.membership.one({userId: authUser.id, id: Encryption.unmask(membership.id)}, chain.onLoad.bind(null, 'membership', updateOnMembershipLoaded.bind(null, db, membership, callback), callback, true));
        } else {
            callback(new Error(404));
        }

    }
    function updateOnMembershipLoaded (db, jMembership, callback, membership) {
        var fields = db.membership.model.manualFields;
        var changes = 0;
        for (var key in fields) {
            if (jMembership[fields[key]] !== membership[fields[key]]) {
                membership[fields[key]] = jMembership[fields[key]];
                changes++;
            }
        }
        if (changes > 0) {
            membership.modifed = new Date();
            membership.save(chain.onSaved.bind(null, callback));
        } else {
            callback(membership.toJSON());
        }

    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function list (authUser, communityId, db, callback) {
        var communitUnmaskedId = Encryption.unmask(communityId);
        chain ([{name:'community', table:db.community, parameters: communitUnmaskedId, continueIf: chain.onlyIfExists },
                {name:'membership', table:db.membership, parameters: {userId: authUser.id, communityId: communitUnmaskedId }, continueIf: listCanListMembers.bind (null, db) },
                {name:'members', table:db.membership, parameters: {communityId: communitUnmaskedId, status: db.membership.model.status.active }, multiple: {} }
        ], listOnDataLoaded.bind(null, db, callback), callback);
    }

    function listCanListMembers (db, data) {
        return (data.community.join !== db.community.model.join.invite || (data.membership && data.membership.status === db.membership.model.status.active)) ? true : new Error('no-permissions') ;
    }

    function listOnDataLoaded (db, callback, data) {
        callback(data instanceof Error ? data : db.membership.model.toList(data.members));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function requests (authUser, communityId, db, callback) {
        var communitUnmaskedId = Encryption.unmask(communityId);
        chain ([{name:'membership', table:db.membership, parameters: {userId: authUser.id, communityId: communitUnmaskedId }, continueIf: requestsCanApproveRequests.bind(null, db)},
                {name:'members', table:db.membership, parameters: {communityId: communitUnmaskedId, status: db.membership.model.status.requested}, multiple: {} }
                ], listOnDataLoaded.bind(null, db, callback), callback);
    }

    function requestsCanApproveRequests (db, data) {
        return (data.membership.status === db.membership.model.status.active && data.membership.can ('approve-members')) ? true : new Error('no-permissions') ;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function invitations (authUser, communityId, db, callback) {
        var communitUnmaskedId = Encryption.unmask(communityId);
        chain ([{name:'membership', table:db.membership, parameters: {userId: authUser.id, communityId: communitUnmaskedId }, continueIf: invitationsUpdateQuery.bind (null, db)},
                {name:'members', table:db.membership, parameters: {approverId: false, communityId: communitUnmaskedId , join: db.community.model.join.invite }, multiple: {} }
        ], listOnDataLoaded.bind(null, db, callback), callback);
    }

    function invitationsUpdateQuery (db, data, tasks) {
        tasks[0].parameters.approverId = data.membership.id;
        return (data.membership.status === db.membership.model.status.active && data.membership.can ('invite-members')) ? true : new Error('no-permissions') ;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function listCommunities (authUser, membershipId, db, callback) {
        var tasks = [];
        if (membershipId === undefined) {
            tasks = [{name:'memberships', table:db.membership, parameters: { userId: authUser.id }, multiple: {} }];
        } else {
            tasks =[{name:'membership', table:db.membership, parameters: Encryption.unmask(membershipId), continueIf: listCommunitiesIsListPublic.bind(null,authUser.id)},
                    {name:'memberships', table:db.membership, parameters: { userId: false }, multiple: {} }
            ];
        }
        chain (tasks, listCommunitiesOnMembershipsLoaded.bind(null, db, callback), callback);
    }
    function listCommunitiesIsListPublic (authUserId, data, tasks) {
        tasks[0].parameters.userId = data.membership.userId;
        return (data.membership.userId === authUserId || data.membership.isPublic) ? true : new Error(401) ;
    }

    function listCommunitiesOnMembershipsLoaded (db, callback, data) {
        var CommunityIds = [];
        var membershipByCommunityId = {};
        var membershipsCount = data.memberships.length;
        var isCurrentUserList = (data.membership === undefined);

        if (membershipsCount) {
            for (var i = 0; i < membershipsCount; i++) {
                var membership = data.memberships[i];
                if (isCurrentUserList || membership.status === db.membership.model.status.active) {
                    CommunityIds.push(membership.communityId);
                    membershipByCommunityId[membership.communityId] = membership;
                }
            }
            db.community.find({id: CommunityIds}, chain.onLoad.bind(null, 'communities', listCommunitiesOnCommunitiesLoaded.bind(null, callback, isCurrentUserList, membershipByCommunityId), callback, false));
        } else {
            callback([]);
        }

    }
    function listCommunitiesOnCommunitiesLoaded (callback, isCurrentUserList, membershipByCommuntyId, dCommunities) {
        var communities = [];
        var count = dCommunities.length;

        for (var i = 0; i < count; i++) {
            var community = dCommunities[i].toJSON();
            if (isCurrentUserList) {
                var membership = membershipByCommuntyId[dCommunities[i].id];
                community.membershipId = Encryption.mask(membership.id);
                community.membershipStatus = membership.status;
                community.membershipName = membership.name;
            }
            communities.push(community);
        }
        callback(communities);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // updateUser
    // getUserPublicData
    // get user photo
    // get any user photo
    module.exports.add = add;
    module.exports.reject = reject;
    module.exports.decline = decline;
    module.exports.quit = quit;
    module.exports.update = update;
    module.exports.list = list;
    module.exports.requests = requests;
    module.exports.invitations = invitations;
    module.exports.listCommunities = listCommunities;

})();