;(function membershipControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function updateCommunityMemberCount (db, delta, data) {
    var community = data.community;
    community.members = community.members + delta;
    if (community.members <= 0) {
      community.status =  db.community.model.status.archived;
    }
    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, membershipId, communityId, db, callback) {
    var tasks = {
      membership: { table: db.membership, load: {}, beforeSave: sergeant.and(sergeant.stopIfNotFound,archiveUpdateMembership.bind(null,db, authUser.id )), save: true, finally: sergeant.json },
      community: {  table:db.community, beforeSave: sergeant.and(sergeant.stopIfNotFound,updateCommunityMemberCount.bind(null,db, -1)), save: true, finally: sergeant.json }
    };
    if (membershipId) {
      var unmaskedMembershipId = Encryption.unmask (membershipId);
      if (isNaN(unmaskedMembershipId)) {
        callback(Errors.badInput('membershipId',membershipId));
        return;
      }
      tasks.membership.load.id = unmaskedMembershipId;
      tasks.community.before = archiveUpdateCommunityQuery;
    } else if (communityId) {
      var unmaskedCommunityId = Encryption.unmask (communityId);
      if (isNaN(unmaskedCommunityId)) {
        callback(Errors.badInput('communityId',communityId));
        return;
      }
      tasks.membership.load.communityId = unmaskedCommunityId;
      tasks.membership.load.userId = authUser.id;
      tasks.community.load = unmaskedCommunityId;
    } else {
      callback(Errors.missingInput('membershipId'));
      return;
    }
    sergeant (tasks, 'membership,community', callback);
  }
  function archiveUpdateMembership (db, userId, data) {
    if (data.membership.userId !== userId) {
      return Errors.noPermissions('remove-member');
    }
    data.membership.status = db.membership.model.status.archived;
    data.membership.modified = new Date();
    return true;
  }

  function archiveUpdateCommunityQuery (repository, tasks) {
    tasks.community.load = repository.membership.communityId;
    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function exists ( optionalUser, membership, db, callback ) {
    var parameters = {};
    if ( membership.name !== undefined ) {
      parameters.name = membership.name;
      var nameIsValid = db.membership.model.isValidName(membership.name);
      if (nameIsValid !== true) {
        return callback(nameIsValid);
      }
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

    var tasks = {
      membership : { table:db.membership, load: unmaskedMembershipId, after: sergeant.and(sergeant.stopIfNotFound, onMembershipLoaded.bind(null, optionalUser)), finally: sergeant.minimalJson },
      me : { table:db.membership, after: sergeant.and(onMyMembershipLoaded), finally: sergeant.remove },
      viewpoint : { table:db.membershipViewpoint, finally: sergeant.json}
    };
    if (optionalUser !== undefined) {
      tasks.me.load = { userId: optionalUser.id };
    }
    sergeant (tasks, 'membership,me,viewpoint', callback);
  }

  function onMembershipLoaded (optionalUser, data, tasks) {
    if (optionalUser && optionalUser.id === data.membership.userId) {
      tasks.membership.finally = sergeant.json;
    }
    return true;
  }

  function onMyMembershipLoaded (data, tasks) {
    if (data.me) {
      tasks.viewpoint.load = {
        memberId: data.me.id,
        subjectId: data.membership.id
      };
    }
    return true;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, communityId, db, callback) {
    if (communityId !== undefined) {
      listCommunityMembers (optionalUser, Encryption.unmask(communityId), db, callback);
    } else if (optionalUser !== undefined) {
      listUserMemberships (optionalUser.id, db, callback);
    } else {
      callback (Errors.missingInput('communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//
  function listUserMemberships(userId, db, callback) {
    var tasks = {
      memberships: { table:db.membership, load: {userId: userId, status: db.membership.model.status.active }, multiple: {}, finally: sergeant.json },
      communities : { table:db.community, before:prepareCommunityList, load: { status: db.membership.model.status.active }, multiple: {}, finally: sergeant.jsonMap.bind(null,'id') }
    };
    sergeant(tasks, 'memberships,communities', callback);
  }

  function prepareCommunityList (repository, tasks) {
    var list = [];
    var memberships = repository.memberships;
    var membershipCount = memberships.length;

    if (membershipCount === 0 ) {
      delete tasks.communities.load;
    } else {
      while (membershipCount--) {
        list[membershipCount] = memberships[membershipCount].communityId;
      }

      tasks.communities.load.id = list;
    }
    return true;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function listCommunityMembers (optionalUser, communityId, db, callback) {
    var tasks = {
      community: { table:db.community, load: communityId, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      membership: { table:db.membership, after: canListCommunityMembers.bind (null, db), finally: sergeant.remove },
      members: { table:db.membership, load: {communityId: communityId, status: db.membership.model.status.active }, multiple: {}, finally: sergeant.json }
    };
    if (optionalUser !== undefined) {
      tasks.membership.load = { userId: optionalUser.id, communityId: communityId, status: db.membership.model.status.active };
    }
    sergeant (tasks, 'community,membership,members', callback);
  }

  function canListCommunityMembers (db, data) {
    return (data.community.type !== db.community.model.type.secret || (data.membership !== null)) ? true : new Error('no-permissions') ;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, membership, membershipImage, communityId, membershipId, files, db, callback) {
    if (membership === undefined) {
      callback (Errors.missingInput('membership'));
      return;
    }
    if (membershipId !== undefined) {
      membership.id = membershipId;
    }
    if (communityId !== undefined) {
      membership.communityId = communityId;
    }
    var onceMembershipIsSaved = membershipImage ? saveMembershipImage.bind(null,membershipImage,files, callback) : callback;

    var tasks  ={
      current : { table:db.membership, load:{ userId: authUser.id }, finally: sergeant.remove },
      sameName : { table:db.membership, finally: sergeant.remove },
      community: { table:db.community, load: membership.communityId, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      user: { table:db.user, load: authUser.id, finally: sergeant.remove },
      membership: { table: db.membership,
                    before: setCommunityType.bind(null, membership, db),
                    beforeSave: setPrepareSave.bind(null, membership, db),
                    save: true,
                    after: setAfterAdd.bind(null, db), finally: sergeant.json }
    };

    membership.userId = authUser.id; // this is relevant for new memberships

    if (membership.name !== undefined) {
      // check if name already in use
      tasks.sameName.load = { name : membership.name };
      tasks.sameName.after = checkIfSameNameIsCurrent;
    } else if (membership.id === undefined) {
      callback (Errors.missingInput('membership.name'));
      return;
    }
    if (membership.id !== undefined) {
      // update
      membership.id = Encryption.unmask(membership.id);
      tasks.current.load = membership.id;
      tasks.community.before = setPrepareCommunityIdQuery;
    } else if (membership.communityId !== undefined) {
      // add
      membership.communityId = Encryption.unmask(membership.communityId);
      tasks.current.load.communityId = membership.communityId;
      tasks.community.load = membership.communityId;
    } else {
      callback (Errors.missingInput('membership.communityId'));
      return;
    }

    sergeant (tasks, 'current,sameName,community,user,membership', onceMembershipIsSaved);
  }

  function checkIfSameNameIsCurrent (data) {
    if ((data.sameName === null) || (data.current !== null && data.current.id === data.sameName.id)){
      return true;
    } else {
      return Errors.alreadyExists('membership.name',data.sameName.name);
    }
  }

  function setPrepareCommunityIdQuery (data, tasks) {
    tasks.community.load = data.current.communityId;
    return true;
  }

  function setCommunityType (membership, db, data, tasks) {
    var communityTypes = db.community.model.type;
    switch (data.community.type) {
      case communityTypes.exclusive:
        tasks.membership.beforeSave = controllers.requests.setPrepareSave.bind(null, membership, db);
        break;
      case communityTypes.secret:
        tasks.membership.beforeSave = controllers.invitations.setPrepareSave.bind(null, membership, db);
        break;
      case communityTypes.public:
        break;
      default:
        return Errors.badInput(data.community.toJSON());
    }
    return true;
  }

  function setPrepareSave (membership, db, data, tasks) {
    var communityTypes = db.community.model.type;
    var status = db.membership.model.status;

    var current = data.current;
    var community = data.community;
    var user = data.user;

    membership.communityId = community.id; // for updates that start with membership.id
    membership.type = communityTypes.public;
    membership.status = status.active;

    if (community.isFit(user)) {
      if (current) {
        sergeant.update(membership, current);
      } else {
        updateCommunityMemberCount ( db,1, data);
        community.save();
      }
    } else {
      if (current) {
        current.status = status.unfit;
      } else {
        return Errors.noPermissions('unfit-to-join-community');
      }
    }

    tasks.membership.data = current ? current : db.membership.model.getNew(membership);
    return db.membership.model.isValid(membership);
  }
  function setAfterAdd (db, data) {
    if (data.membership.status === db.membership.model.status.unfit) {
      return new Error('user-not-fit-for-community');
    } else {
      return true;
    }
  }
  function saveMembershipImage (membershipImage,files, callback, data) {
    controllers.profileImage.saveProfileImageFile(data.membership.id, membershipImage, files, callback.bind(null, data));

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