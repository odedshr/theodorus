;(function requestsControllerEnclosure() {
  'use strict';

  var Encryption = require('../helpers/Encryption.js'),
      Errors = require('../helpers/Errors.js'),
      sergeant = require('../helpers/sergeant.js'),
      controllers = {};

  function add(authUser, email, name, communityId, db, callback) {
    var tasks = {
      community: {
        table: db.community,
        load: communityId,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove
      },

      currentMember: {
        table: db.membership,
        load: { userId: authUser.email,
                communityId: communityId },
        finally: sergeant.remove
      },

      membership: {
        table: db.membership,
        load: { email: email || authUser.email,
                communityId: communityId },
      },

      user: {
        table: db.user,
        before: getUserIdFromMembership,
      },

      saveMembership: {
        table: db.membership,
        before: prepareMembership.bind({}, db, authUser, email || authUser.email, name),
        finally: sergeant.remove
      },

      saveCommunity: {
        table: db.community,
        finally: sergeant.remove
      }

    };

    sergeant(tasks, 'community,currentMember,membership,user,saveMembership,saveCommunity', callback);
  }

  function getUserIdFromMembership(data, tasks) {
    if (data.membership) {
      tasks.user.load = data.membership.userId;
    }
  }

  function prepareMembership(db, authUser, email, name, data, tasks) {
    if (data.membership !== undefined) {
      return addMembership(db, authUser, email, name, data, tasks);
    } else {
      return updateMembership(db, authUser, email, name, data, tasks);
    }
  }

  function addMembership(db, authUser, email, name, data, tasks) {
    var community = data.community,
        communityTypes = db.community.model.type,
        currentMember = data.currentMember,
        statuses = db.membership.model.status,
        membershipEmail = (authUser.email === email) ? authUser.id : undefined,
        membership = db.membership.model.getNew(undefined,
                                                membershipEmail,
                                                community.id,
                                                name,
                                                email,
                                                community.type,
                                                undefined);

    if (authUser.email !== membership.email &&
        [communityTypes.public, communityTypes.secret].indexOf(community.type) > -1) {
      // user is inviting another user:
      if (currentMember.status === statuses.active && currentMember.can('invite-members')) {
        membership.approverId = currentMember.id;
        membership.status = statuses.invited;
      } else {
        return Errors.noPermissions('invite-members');
      }

    } else if (community.founderId === authUser.id) {
      // user is actually the founder:
      membership.type = community.type;
      updateCommunityMemberCount(db, data, tasks, 1);
      tasks.saveMembership = membership;
    } else {
      // user wants to join a community:
      if (community.isFit(data.user)) {
        membership.type = community.type;

        switch (community.type) {
          case communityTypes.exclusive:
            // user's request must get approved
            membership.status = statuses.requested;
            break;
          case communityTypes.public:
            // user can join, no problem
            updateCommunityMemberCount(db, data, tasks, 1);
            break;
          case communityTypes.secret:
            // secret communities requires an invite to join
            return Errors.custom('cannot-join-secret-community');
          default:
            return Errors.systemError('community-with-no-type');
        }
      } else {
        return Errors.custom('user-not-fit-for-community');
      }
    }

    tasks.saveMembership.data = membership;
    tasks.saveMembership.save = true;
  }

  function updateMembership(db, authUser, email, name, data, tasks) {
    var currentMember = data.currentMember,
        statuses = db.membership.model.status,
        membership = data.membership;

    if (name !== undefined) {
      membership.name = name;
    }

    // membership might have been requested earlier, but join timestamp is now:
    if ([statuses.requested, statuses.invited].indexOf(membership.status) > -1) {
      membership.created = new Date();
    }

    switch (membership.status) {
      case statuses.requested:
      case statuses.declined:
        if ((membership.email !== currentMember.email) && (currentMember.status === statuses.active && currentMember.can('approve-members'))) {
          membership.approverId = currentMember.id;

          updateCommunityAndMembership(db, data, tasks, statuses);
        } else {
          return Errors.noPermissions('approve-members');
        }

        break;
      case statuses.invited:
      case statuses.rejected:
        if (membership.email === currentMember.email) {
          updateCommunityAndMembership(db, data, tasks, statuses);
        } else if (membership.approverId === authUser.id) {
          return Errors.custom('only-invited-can-accept-invitation', membership.email);
        } else {
          return Errors.custom('already-invited', membership.email);
        }

        break;
      case statuses.quit:
      case statuses.unfit:
        updateCommunityAndMembership(db, data, tasks, statuses);
        break;
      case statuses.active:
        return Errors.alreadyExists('membership', membership);
      default:
        return Errors.badInput('membership.status', membership.status);
    }

    membership.modified = new Date();
    tasks.saveMembership.data = membership;
    tasks.saveMembership.save = true;
  }

  function updateCommunityAndMembership(db, data, tasks, statuses) {
    if (data.community.isFit(data.user)) {
      updateCommunityMemberCount(db, data, tasks, 1);
      data.membership.status = statuses.active;
    } else {
      data.membership.status = statuses.unfit;
    }
  }

  function updateCommunityMemberCount(db, data, tasks, delta) {
    var community = data.community;

    community.members = community.members + delta;

    if (community.members <= 0) {
      community.status =  db.community.model.status.archived;
    }

    tasks.saveCommunity.data = community;
    tasks.saveCommunity.save = true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function setControllers(controllerMap) {
    controllers = controllerMap;
  }

  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.set = add;
  module.exports.updateCommunityMemberCount = updateCommunityMemberCount;
})();