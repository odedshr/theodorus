;(function requestsControllerEnclosure() {
  'use strict';

  var Encryption = require('../helpers/Encryption.js'),
      Errors = require('../helpers/Errors.js'),
      setRequest = require('./request.set.controller.js'),
      sergeant = require('../helpers/sergeant.js'),
      controllers = {};

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function reject(authUser, membershipId, db, callback) {
    var statuses = db.membership.model.status,
      tasks = {
        membership: {
          table: db.membership,
          load: membershipId,
          after: sergeant.stopIfNotFound
        },
        approver: {
          table: db.membership,
          load: { userId: authUser.email },
          finally: sergeant.remove,
          before: function getCommunityId(data, tasks) {
            tasks.currentMember.load.communityId = data.membership.communityId;
          }
        },
        saveMember: {
          table: db.membership,
          finally: sergeant.remove,
          beforeSave: function prepare(data, tasks) {
            var membership = data.membership,
                approver = data.approver;

            if ([statuses.requested, statuses.rejected].indexOf(membership.status) === -1) {
              return Errors.badInput('status', data.membership.status);
            }

            if (data.approver.status !== statuses.active && !data.approver.can('approve-members')) {
              return Errors.noPermissions('approve-members');
            }

            membership.status = db.membership.model.status.rejected;
            membership.approverId = approver.id;
            membership.modified = new Date();
            tasks.saveMember.data = membership;
            tasks.saveMember.save = true;
          }
        }
      };

    sergeant(tasks, 'approver,membership,saveMember', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function decline(membershipId, db, callback) {
    sergeant({
      membership: {
        table: db.membership,
        load: Encryption.decode(membershipId),
        beforeSave: sergeant.and(sergeant.stopIfNotFound, function prepareDecline(data, tasks) {
          var membership = data.membership,
              statuses = db.membership.model.status;

          if (membership.status === statuses.invited) {
            membership.status = statuses.declined;
            membership.modified = new Date();
            tasks.membership.save = true;
          } else {
            callback(Errors.badInput('status', membership.status));
          }
        })
      } }, 'membership', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function quit(authUser, communityId, db, callback) {
    var tasks = {
      community: {
        table: db.community,
        load: communityId,
        after: sergeant.stopIfNotFound
      },
      membership: {
        table: db.membership,
        load: { userId: authUser.id, communityId: communityId },
        beforeSave: sergeant.and(sergeant.stopIfNotFound, function quitUpdateMembership(db, data, tasks) {
          var membership = data.membership;

          if (membership.status === db.membership.model.status.active) {
            membership.status = db.membership.model.status.quit;
            membership.modified = new Date();
            setRequest.updateCommunityMemberCount(db, data.community, -1);
            tasks.membership.save();
          } else {
            return Errors.badInput('status', membership.status);
          }
        })
      },
      saveCommunity: {
        table: db.community,
        finally: sergeant.remove
      }
    };

    sergeant(tasks, 'community,membership,saveCommunity', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function update(authUser, membership, membershipId, db, callback) {
    sergeant({
      membership: {
        table: db.membership,
        load: { userId: authUser.id, id: membershipId || membership.id },
        finally: sergeant.toJSON,
        beforeSave: sergeant.and(sergeant.stopIfNotFound, function prepareUpdate(data, tasks) {
          var dMembership = data.membership,
              fields = db.membership.model.manualFields,
              changes = 0,
              key,
              newValue;

          for (key in fields) {
            newValue = membership[fields[key]];

            if ((newValue !== undefined) && (newValue !== membership[fields[key]])) {
              dMembership[fields[key]] = newValue;
              changes++;
            }
          }

          if (changes > 0) {
            dMembership.modified = new Date();
            tasks.membership.save = true;
          }
        })
      }
    }, 'membership', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list(authUser, communityId, db, callback) {
    var tasks = {
      community: {
        table: db.community,
        load: communityId,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove
      },
      membership: {
        table: db.membership,
        load: { userId: authUser.id, communityId: communityId },
        after: sergeant.and(sergeant.stopIfNotFound, function canListMembers(data) {
          return (data.community.type !== db.community.model.type.secret ||
                 (data.membership.status === db.membership.model.status.active)) ?
                 true : Errors.noPermissions('list-members');
        }),
        finally: sergeant.remove
      },
      members: {
        table: db.membership,
        load: { communityId: communityId, status: db.membership.model.status.active },
        multiple: {},
        finally: sergeant.json
      }
    };

    sergeant(tasks, 'community,membership,members', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // return all requests to join a specific community
  function requests(authUser, communityId, db, callback) {
    sergeant({
      membership: {
        table: db.membership,
        load: { userId: authUser.id,
                communityId: communityId,
                status: db.membership.model.status.active },
        finally: sergeant.remove,
        after: sergeant.and(sergeant.stopIfNotFound, function checkPermission(data) {
          return data.membership.can('approve-members') ? true : Errors.noPermissions('list-requests');
        })
      },
      requests: {
        table: db.membership,
        load: { communityId: communityId,
                status: db.membership.model.status.requested },
        multiple: {},
        finally: sergeant.json
      }
    }, 'membership,requests', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // return the invitations currentUser has sent in a specific community
  function invitations(authUser, communityId, db, callback) {
    sergeant({
      membership: {
        table: db.membership,
        load: { userId: authUser.id,
                communityId: communityId,
                status: db.membership.model.status.active },
        finally: sergeant.remove,
        after: sergeant.and(sergeant.stopIfNotFound, function checkPermission(data) {
          return data.membership.can('invite-members') ? true : Errors.noPermissions('list-requests');
        })
      },
      invitations: {
        table: db.membership,
        load: { communityId: communityId,
                status: db.membership.model.status.invited },
        multiple: {},
        finally: sergeant.json
      }
    }, 'membership,invitations', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // list all communities+memberships of a user with a given status
  function listCommunities(authUser, membershipId, status, db, callback) {
    var isCurrentUserList = true,
        membershipStatus = status || db.membership.model.status.active,
        tasksQueue = 'membership,communities',
        tasks = {
          membership: {
            table: db.membership,
            load: {
              id: membershipId
            },
            finally: sergeant.remove,
            after: sergeant.and(sergeant.stopIfNotFound, function setUserId(data, tasks) {
              if (data.membership.userId !== authUser.id && !data.membership.isPublic)  {
                return Errors.noPermissions('list-communities');
              }

              tasks.memberships.load.userId = data.membership.userId;
            })
          },
          memberships: {
            table: db.membership,
            load: { userId: authUser.id },
            multiple: {},
            finally: sergeant.json
          },
          communities: {
            table: db.communities,
            load: { status: db.community.model.status.active },
            finally: sergeant.json,
            before: function prepareCommunitiesLoadList(data, tasks) {
              var communityIds = [];

              data.communityToMembership = {};
              data.memberships.forEach(function addCommunityId(membership) {
                if (isCurrentUserList || membership.status === membershipStatus) {
                  communityIds.push(membership.communityId);
                  data.communityToMembership[membership.communityId] = membership;
                }
              });

              tasks.communities.load = { id: communityIds };
            }
          }
        };

    if (membershipId !== undefined) {
      isCurrentUserList = false;
      tasksQueue = 'membership,' + tasksQueue;
      // can only ask about active memberships of other users
      membershipStatus = db.membership.model.status.active;
    }

    sergeant(tasks, tasksQueue, callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function exists(optionalUser, communityId, name, db, callback) {
    sergeant({
      membership: {
        table: db.membership,
        load: { name: name,
                communityId: communityId },
        finally: sergeant.remove,
        after: function existsOnLoaded(optionalUser, data, tasks) {
          // return true if membership is not an error and its id is not of the current user
          data.exists = (data.membership !== null) && ((optionalUser || {}).id !== data.membership.id);
          data.type = 'membership';
          data.parameters = tasks.membership.load;
        } }
    }, 'membership', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function setControllers(controllerMap) {
    controllers = controllerMap;
  }

  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // updateUser
  // getUserPublicData
  // get user photo
  // get any user photo
  module.exports.exists = exists;
  module.exports.set = setRequest.set;
  module.exports.reject = reject;
  module.exports.decline = decline;
  module.exports.quit = quit;
  module.exports.update = update;
  module.exports.list = list;
  module.exports.requests = requests;
  module.exports.invitations = invitations;
  module.exports.listCommunities = listCommunities;
  module.exports.get = function() {};

  module.exports.archive = function() {};
})();
