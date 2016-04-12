;(function membershipControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var chain = require('../helpers/chain.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function updateCommunityMemberCount (db, community, delta) {
    community.members = community.members +delta;
    if (community.members <= 0) {
      community.status =  db.community.model.status.archived;
    }
    community.save(chain.andThenNothing);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, membershipId, communityId, db, callback) {
    var tasks = [];
    if (membershipId) {
      var unmaskedMembershipId = Encryption.unmask (membershipId);
      if (isNaN(unmaskedMembershipId)) {
        callback(Errors.badInput('membershipId',membershipId));
        return;
      }
      tasks = [{name:'membership', table:db.membership, parameters: { userId: authUser.id, membershipId: unmaskedMembershipId }, continueIf: archiveUpdateCommunityQuery },
               {name:'community', table:db.community, parameters: {}, continueIf: chain.onlyIfExists }];
    } else if (communityId) {
      var unmaskedCommunityId = Encryption.unmask (communityId);
      if (isNaN(unmaskedCommunityId)) {
        callback(Errors.badInput('communityId',communityId));
        return;
      }
      tasks = [{name:'membership', table:db.membership, parameters: { userId: authUser.id, communityId: unmaskedCommunityId }, continueIf: chain.onlyIfExists },
               {name:'community', table:db.community, parameters: unmaskedCommunityId, continueIf: chain.onlyIfExists }];
    } else {
      callback(Errors.missingInput('membershipId'));
      return;
    }
    chain (tasks, archiveOnDataLoaded.bind(null, db, callback), callback);
  }

  function archiveUpdateCommunityQuery (repository, tasks) {
    if (repository.membership) {
      tasks[0].parameters = repository.membership.communityId;
    }
    return (repository.membership !== null);
  }

  function archiveOnDataLoaded (db, callback, data) {
    updateCommunityMemberCount (data.community, -1);
    data.membership.status = db.membership.model.status.archived;
    data.membership.modified = new Date();
    data.membership.save(chain.onSaved(callback));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function exists ( optionalUser, membership, db, callback ) {
    var parameters = {};
    if (membership.name !== undefined) {
      parameters.name = membership.name;
    } else if (optionalUser !== undefined) {
      parameters.userId = optionalUser.id;
    }
    if (Object.keys(parameters).length === 0) {
      callback (Errors.missingInput('membership.name'));
    } else if (membership.communityId === undefined) {
      callback (Errors.missingInput('membership.communityId'));
    } else {
      parameters.communityId = Encryption.unmask(membership.communityId);
      db.membership.one(parameters, existsOnLoaded.bind(null, membership, callback));
    }
  }

  function existsOnLoaded (jMembership, callback, error, membership) {
    callback ({type: 'membership', exists: (membership !== null), parameters: jMembership });
  }

   ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, membershipId, db, callback) {
    var unmaskedMembershipId = Encryption.unmask(membershipId);
    if (isNaN(unmaskedMembershipId)) {
      callback(Errors.badInput('membershipId',membershipId));
      return;
    }

    var tasks = [{name:'membership', table:db.membership, parameters: unmaskedMembershipId, continueIf: chain.onlyIfExists }];
    //TODO: include MemberViewpoint
    chain (tasks, getOnDataLoaded.bind(null, optionalUser, callback), callback);
  }

  function getOnDataLoaded (optionalUser, callback, data) {
    data.membership = (optionalUser && optionalUser.id === data.membserhip.userId) ? data.membership.toJSON() :data.membership.toMinJSON()  ;
    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, communityId, db, callback) {
    if (communityId !== undefined) {
      listCommunityMembers (optionalUser, Encryption.unmask(communityId), db, callback);
    } else if (optionalUser !== undefined) {
      listUserCommunities(optionalUser.id, db, callback);
    } else {
      callback (Errors.missingInput('communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//
  function listUserCommunities(userId, db, callback) {
    chain([{name:'members', table:db.membership, parameters: {userId: userId, status: db.membership.model.status.active }, multiple: {} , continueIf: setCommunitiesToList},
      {name:'communities', table:db.community, parameters: { status: db.membership.model.status.active }, multiple: {} }
    ], listOnDataLoaded.bind(null, db, callback), callback);
  }

  function setCommunitiesToList (repository, tasks) {
    var list = [];
    var memberships = repository.members.length;
    var membershipCount = memberships.length;

    while (membershipCount--) {
      list[membershipCount] = memberships[membershipCount].communityId;
    }

    tasks[0].parameters.id = list;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function listCommunityMembers (optionalUser, communityid, db, callback) {
    var tasks = [{name:'community', table:db.community, parameters: communityid, continueIf: chain.onlyIfExists },
      {name:'membership', data: null, continueIf: canListCommunityMembers.bind (null, db) },
      {name:'members', table:db.membership, parameters: {communityId: communityid, status: db.membership.model.status.active }, multiple: {} }
    ];
    if (optionalUser !== undefined) {
      delete tasks[1].data;
      tasks[1].table = db.membership;
      tasks[1].parameters = {userId: optionalUser.id, communityId: communityid, status: db.membership.model.status.active };
    }
    chain (tasks, listOnDataLoaded.bind(null, db, callback), callback);
  }

  function canListCommunityMembers (db, data) {
    return (data.community.type !== db.community.model.type.secret || (data.membership !== null)) ? true : new Error('no-permissions') ;
  }

  function listOnDataLoaded (db, callback, data) {
    if (data.communities !== undefined) {
      callback ( {
        communities: db.community.model.toList(data.communities, 'toMinJson'),
        memberships: db.community.model.toMap(data.memberships, 'communityId', 'toMinJson')
      });
    } else {
      callback ( {
        members: db.community.model.toList(data.memberships, 'toMinJson')
      });
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, membership, membershipImage, communityId, membershipId, files, db, callback) {
    if (membershipId !== undefined) {
      membership.id = membershipId;
    }
    if (communityId !== undefined) {
      membership.communityId = communityId;
    }
    var onceMembershipIsSaved = chain.onSaved.bind(null, membershipImage ? saveMembershipImage.bind(null,membershipImage,files, callback) : membershipSaved.bind(null, callback));

    if (membership.id !== undefined) {
      membership.communityId = Encryption.unmask(membership.communityId);
      chain ([{name:'existing', table:db.membership, parameters:{ userId: authUser.id, communityId: membership.communityId } },
              {name:'community', table:db.community, parameters: membership.communityId },
              {name:'user', table:db.user, parameters: authUser.id }],
        add.bind(null, membership, onceMembershipIsSaved, db, callback), callback);
    } else if (membership.communityId !== undefined) {
      chain ([{name:'membership', table:db.membership, parameters:{ id: Encryption.unmask(membership), userId: authUser.id, status: db.membership.model.status.active }, continueIf: chain.onlyIfExists} ],
            update.bind(null, membership, callback), callback);
    } else {
      callback (Errors.missingInput('membership.communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (membership, onceMembershipIsSaved, db, callback, data) {
    var existing = data.existing;
    var community = data.community;
    var user = data.user;
    if (data.community.isFit(user)) {
      var communityTypes = db.community.model.type;
      switch (community.type) {
        case communityTypes.exclusive:
          membership.type = db.community.model.type.exclusive;
          membership.status = db.membership.model.status.requested;
          break;
        case communityTypes.public:
          membership.type = db.community.model.type.public;
          updateCommunityMemberCount ( db,community, 1);
          break;
        case communityTypes.secret:
          callback(new Error('cannot-join-secret-community'));
          return;
        default:
          callback(new Error('community-with-no-type'));
          return;
      }
      db.membership.create(membership, onceMembershipIsSaved);
    } else {
      if (existing) {
        existing.status = db.membership.model.status.unfit;
        existing.save();
      }
      callback(new Error('user-not-fit-for-community'));
    }
  }

  function saveMembershipImage (membershipImage,files, callback, jMembership) {
    controllers.profileImage.saveProfileImageFile(jMembership.id, membershipImage, files, membershipSaved.bind(jMembership, callback));
  }

  function membershipSaved (callback, jMembership) {
    callback ( { membership : jMembership});
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (jMembership, callback, data) {
    var membership = data.membership;
    data.community = chain.update(jMembership, membership);
    var isValid = membership.isValid();
    if (isValid instanceof Error) {
      callback(isValid);
    } else {
      membership.save( chain.onSaved(callback));
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};
  function setControllers (controllerMap) {
    controllers = controllerMap;
  }
  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.archive = archive;
  module.exports.exists = exists;
  module.exports.get = get;
  module.exports.list = list;
  module.exports.set = set;

})();