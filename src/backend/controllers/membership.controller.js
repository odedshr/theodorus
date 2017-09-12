;(function membershipControllerEnclosure() {
  'use strict';

  var Errors = require('../helpers/Errors.js'),
      modelUtils = require('../helpers/modelUtils.js'),
      sergeant = require('../helpers/sergeant.js'),
      Records = require('../helpers/RecordManager.js'),

      controllers = {};

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function updateCommunityMemberCount(db, delta, data) {
    var community = data.community;

    community.members = community.members + delta;

    if (community.members <= 0) {
      community.status =  db.community.model.status.archived;
    }

    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive(authUser, membershipId, communityId, db, callback) {
    var tasks = {
      membership: {
        table: db.membership,
        load: {},
        beforeSave: sergeant.and(sergeant.stopIfNotFound,
          archiveUpdateMembership.bind(null, db, authUser.id)),
        save: true,
        finally: sergeant.json },
      community: {
        table: db.community,
        beforeSave: sergeant.and(sergeant.stopIfNotFound,
          updateCommunityMemberCount.bind(null, db, -1)),
        save: true,
        finally: sergeant.json },
      record: Records.getNewTask(db, db.record.model.type.leave)
    };

    if (membershipId) {
      tasks.membership.load.id = membershipId;
      tasks.community.before = archiveUpdateCommunityQuery;
    } else if (communityId) {
      tasks.membership.load.communityId = communityId;
      tasks.membership.load.userId = authUser.id;
      tasks.community.load = communityId;
    } else {
      callback(Errors.missingInput('membershipId'));

      return;
    }

    sergeant(tasks, 'membership,community,record', callback);
  }

  function archiveUpdateMembership(db, userId, data) {
    if (data.membership.userId !== userId) {
      return Errors.noPermissions('remove-member');
    }

    data.membership.status = db.membership.model.status.archived;
    data.membership.modified = new Date();

    return true;
  }

  function archiveUpdateCommunityQuery(repository, tasks) {
    tasks.community.load = repository.membership.communityId;

    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function exists(optionalUser, membership, db, callback) {
    var parameters = {},
        aliasIsValid;

    if (membership.alias !== undefined) {
      parameters.alias = membership.alias;
      aliasIsValid = db.membership.model.isValidAlias(membership.alias);

      if (aliasIsValid !== true) {
        return callback(aliasIsValid);
      }
    } else if (optionalUser !== undefined) {
      parameters.userId = optionalUser.id;
    }

    if (Object.keys(parameters).length === 0) {
      callback(Errors.missingInput('membership.alias'));
    } else if (membership.communityId === undefined) {
      callback(Errors.missingInput('membership.communityId'));
    } else {
      parameters.communityId = membership.communityId;
      db.membership.one(parameters, existsOnLoaded.bind(null, membership, callback));
    }
  }

  function existsOnLoaded(jMembership, callback, error, membership) {
    callback({ type: 'membership', exists: (membership !== null), parameters: jMembership });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get(optionalUser, membershipId, db, callback) {
    var tasks = {
      membership: {
        table: db.membership,
        load: membershipId,
        after: sergeant.and(sergeant.stopIfNotFound, onMembershipLoaded.bind(null, optionalUser)),
        finally: sergeant.minimalJson },
      me: {
        table: db.membership,
        after: sergeant.and(onMyMembershipLoaded),
        finally: sergeant.remove },
      review: {
        table: db.membershipReview,
        finally: sergeant.json }
    };

    if (optionalUser !== undefined) {
      tasks.me.load = { userId: optionalUser.id };
    }

    sergeant(tasks, 'membership,me,review', callback);
  }

  function onMembershipLoaded(optionalUser, data, tasks) {
    if (optionalUser && optionalUser.id === data.membership.userId) {
      tasks.membership.finally = sergeant.json;
    }

    return true;
  }

  function onMyMembershipLoaded(data, tasks) {
    if (data.me) {
      tasks.review.load = {
        memberId: data.me.id,
        subjectId: data.membership.id
      };
    }

    return true;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list(optionalUser, communityId, db, callback) {
    if (communityId !== undefined) {
      listCommunityMembers(optionalUser, communityId, db, callback);
    } else if (optionalUser !== undefined) {
      listUserMemberships(optionalUser.id, db, callback);
    } else {
      callback(Errors.missingInput('communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//
  function listUserMemberships(userId, db, callback) {
    var tasks = {
      memberships: {
        table: db.membership,
        load: { userId: userId, status: db.membership.model.status.active },
        multiple: {},
        finally: sergeant.json },
      communities: {
        table: db.community,
        before: prepareCommunityList,
        load: { status: db.membership.model.status.active },
        multiple: {},
        finally: sergeant.jsonMap.bind(null, 'id') }
    };

    sergeant(tasks, 'memberships,communities', callback);
  }

  function prepareCommunityList(data, tasks) {
    var memberships = data.memberships;

    if (memberships.length === 0) {
      delete tasks.communities.load;
    } else {
      tasks.communities.load.id = modelUtils.toVector(memberships, 'communityId');
    }

    return true;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function listCommunityMembers(optionalUser, communityId, db, callback) {
    var tasks = {
      community: {
        table: db.community,
        load: communityId,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove },
      membership: {
        table: db.membership,
        after: canListCommunityMembers.bind(null, db),
        finally: sergeant.remove },
      members: {
        table: db.membership,
        load: { communityId: communityId, status: db.membership.model.status.active },
        multiple: {},
        finally: sergeant.json }
    };

    if (optionalUser !== undefined) {
      tasks.membership.load = { userId: optionalUser.id,
                                communityId: communityId,
                                status: db.membership.model.status.active };
    }

    sergeant(tasks, 'community,membership,members', callback);
  }

  function canListCommunityMembers(db, data) {
    if (data.community.type !== db.community.model.type.secret || (data.membership !== null)) {
      return true;
    }

    return new Error('no-permissions');
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set(authUser, membership, membershipImage, communityId, membershipId, files, db, callback) {
    var onceMembershipIsSaved = callback,
        tasks;

    if (membership === undefined) {
      callback(Errors.missingInput('membership'));

      return;
    }

    if (membershipId !== undefined) {
      membership.id = membershipId;
    }

    if (communityId !== undefined) {
      membership.communityId = communityId;
    }

    membership.hasImage = !!membershipImage;

    if (membershipImage) {
      onceMembershipIsSaved = saveMembershipImage.bind(null, membershipImage, files, db, callback);
    }

    tasks  = {
      current: {
        table: db.membership,
        load: { userId: authUser.id },
        finally: sergeant.remove },
      sameAlias: {
        table: db.membership,
        finally: sergeant.remove },
      community: {
        table: db.community,
        load: membership.communityId,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove },
      user: {
        table: db.user,
        load: authUser.id,
        finally: sergeant.remove },
      membership: {
        table: db.membership,
        before: setCommunityType.bind(null, membership, db),
        beforeSave: setPrepareSave.bind(null, membership, db),
        save: true,
        after: setAfterAdd.bind(null, db),
        finally: sergeant.json },
      updateCommunity: {
        table: db.community,
        finally: sergeant.remove },
      record: Records.getNewTask(db, membership.id ? db.record.model.type.edit : db.record.model.type.add)
    };

    membership.userId = authUser.id; // this is relevant for new memberships

    if (membership.alias !== undefined) {
      // check if name already in use
      tasks.sameAlias.load = { alias: membership.alias, communityId: membership.communityId };
      tasks.sameAlias.after = checkIfSameAliasIsCurrent;
    } else if (membership.id === undefined) {
      callback(Errors.missingInput('membership.alias'));

      return;
    }

    if (membership.id !== undefined) {
      // update
      tasks.current.load = membership.id;
      tasks.current.after = setPrepareCommunityIdQueries;
    } else if (membership.communityId !== undefined) {
      // add
      tasks.current.load.communityId = membership.communityId;
      tasks.community.load = membership.communityId;
    } else {
      callback(Errors.missingInput('membership.communityId'));

      return;
    }

    sergeant(tasks, 'current,sameAlias,community,user,membership,record', onceMembershipIsSaved);
  }

  function checkIfSameAliasIsCurrent(data) {
    if ((data.sameAlias !== null) &&
        (data.current === null || data.current.id !== data.sameAlias.id)) {
      return Errors.alreadyExists('membership.alias', data.sameAlias.alias);
    }
  }

  function setPrepareCommunityIdQueries(data, tasks) {
    if (tasks.sameAlias.load !== undefined) {
      tasks.sameAlias.load.communityId = data.current.communityId;
    }

    tasks.community.load = data.current.communityId;
  }

  function setCommunityType(membership, db, data, tasks) {
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
  }

  function setPrepareSave(membership, db, data, tasks) {
    var status = db.membership.model.status,
        current = data.current,
        community = data.community,
        user = data.user;

    if (community.isFit(user)) {
      if (current) {
        // user was a member previously
        sergeant.update(membership, current);
        current.hasImage = membership.hasImage;
        membership = current;
        membership.status = status.active; //status is not manual and doesn't change via update
      } else {
        membership  = db.membership.model.getNew(membership);
      }

      if (!(current && current.stats === db.membership.model.status.active)) {
        // user isn't not an active member, therefore community count should be updated
        updateCommunityMemberCount(db, 1, data);
        tasks.updateCommunity.data = community;
        tasks.updateCommunity.save = true;
      }
    } else {
      if (current) {
        current.status = status.unfit;
      } else {
        return Errors.noPermissions('unfit-to-join-community');
      }
    }

    tasks.membership.data = membership;

    return db.membership.model.isValid(membership);
  }

  function setAfterAdd(db, data) {
    if (data.membership.status === db.membership.model.status.unfit) {
      return new Error('user-not-fit-for-community');
    }
  }

  function saveMembershipImage(membershipImage, files, db, callback, data) {
    if (!(data instanceof Error)) {
      files.set(controllers.profileImage.getImageFilename(data.membership.id), membershipImage);
    }

    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function setControllers(controllerMap) {
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
