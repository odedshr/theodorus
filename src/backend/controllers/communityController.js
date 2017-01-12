;(function communityRoutesEnclosure() {
  'use strict';
  var sergeant = require('../helpers/sergeant.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var Errors = require('../helpers/Errors.js');
  var modelUtils = require('../helpers/modelUtils.js');
  var tagUtils = require('../helpers/tagUtils.js');
  var validators = require('../helpers/validators.js');
  var Records = require('../helpers/RecordManager.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, communityId, db, callback) {
    sergeant ({
      founder : { table:db.membership, load: { userId: authUser.id, communityId: communityId }, after: sergeant.stopIfNotFound },
      community : { table:db.community,
        load: communityId, after: sergeant.stopIfNotFound ,
        beforeSave: prepCommunityArchive.bind(null,db), save: true, finally: sergeant.json },
      record: Records.getNewTask(db, db.record.model.type.archive)},
      'founder,community,record', callback);
  }

  function prepCommunityArchive (db, data, tasks) {
    if (data.founder.id !== data.community.founderId) {
      return Errors.noPermissions('archive-community');
    }
    var community = data.community;
    community.status = db.community.model.status.archived;
    community.modified = new Date();
  }


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function exists ( community, db, callback ) {
    if (community === undefined|| community.name === undefined) {
     callback (Errors.missingInput('community.name'));
    } else {
      db.community.one({ name: community.name}, existsOnLoaded.bind(null, community, callback));
    }
  }

  function existsOnLoaded (jCommunity, callback, error, community) {
    callback ({type: 'community', exists: (community !== null), parameters: jCommunity });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, communityId, db, callback) {
    var tasks = {
      community : { table:db.community, load: communityId, after: sergeant.stopIfNotFound, finally:sergeant.json },
      membership: { table:db.membership, data: null, finally: sergeant.minimalJson },
      founder: { table:db.membership, json:true, before: getSetFounderIdFromCommunity, finally:sergeant.minimalJson }
    };
    if (optionalUser !== undefined) {
      tasks.membership.load = {userId: optionalUser.id, communityId: communityId };
    }
    sergeant (tasks,'community,membership,founder', callback);
  }

  function getSetFounderIdFromCommunity (data, tasks) {
    tasks.founder.load = data.community.founderId;
    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, db, callback) {
    var tasks = {
      communities : { table:db.community, load: { status: db.community.model.status.active },
        multiple: { order:'name' }, finally: sergeant.json },
      memberships : { table: db.membership, multiple: {}, finally: sergeant.jsonMap.bind(null,'communityId') }
    };
    if (optionalUser !== undefined) {
      tasks.memberships.load  = { userId: optionalUser.id, status: db.membership.model.status.active};
    }
    sergeant (tasks, 'communities,memberships', filterSecretCommunities.bind(null, db, callback));
  }

  function filterSecretCommunities (db, callback, data) {
    var communities = data.communities || [];
    var memberships = data.memberships;
    var secretCommunity = db.community.model.type.secret;
    var keep = [];

    for (var i = 0, length = communities.length; i < length; i++) {
      var community = communities[i];
      if (community.type !== secretCommunity || memberships[community.id]) {
        keep.push(community);
      }
    }
    data.communities = keep;


    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listByTag (optionalUser, tags, db, callback) {
    var tagList = tags.match(/[a-z\d][\w-]*/g);
    var tasks = {
      tags: { table: db.communityTag, load: { value: tagList }, multiple: {},
        after: sergeant.stopIfNotFound, finally: sergeant.json },
      communities : { table: db.community, before: listByTagCommunityQuery,
        load: { status: db.community.model.status.active }, multiple: {}, finally: sergeant.json },
      memberships : { table: db.membership, multiple: {}, finally: sergeant.jsonMap.bind(null,'communityId') }
    };
    if (optionalUser !== undefined) {
      tasks.memberships.load  = { userId: optionalUser.id, status: db.membership.model.status.active};
    }
    sergeant (tasks, 'tags,communities,memberships', filterSecretCommunities.bind(null, db, listByTagOrder.bind(null,callback)));
  }

  function listByTagCommunityQuery (data, tasks) {
    tasks.communities.load.id = modelUtils.toVector(data.tags,'subjectId');
  }

  function compareCommunitiesByTag (tags, a, b) {
    var tagCount = tags[a.id].length - tags[b.id].length;
    return tagCount ? tagCount : ((a.name < b.name) ? -1 :1);
  }

  function listByTagOrder (callback, data) {
    if (data.tags) {
      data.tags = tagUtils.getRelevantSubjectIdMap(data.tags, data.communities);
      data.communities.sort(compareCommunitiesByTag.bind(null, data.tags));
    }
    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listTop (optionalUser, count, page, db, callback) {
    var multipleCommunities = { order: '-score' };
    count = +count;
    page = +page;
    if (count > 0) {
      multipleCommunities.limit = count;
      if (count > 0) {
        multipleCommunities.offset = (page - 1 ) * count;
      }
    }
    var tasks = {
      communities : { table: db.community,
        load: { status: db.community.model.status.active }, multiple: multipleCommunities, finally: sergeant.json },
      memberships : { table: db.membership, multiple: {}, finally: sergeant.jsonMap.bind(null,'communityId') }
    };
    if (optionalUser !== undefined) {
      tasks.memberships.load  = { userId: optionalUser.id, status: db.membership.model.status.active};
    }
    sergeant (tasks, 'communities,memberships', filterSecretCommunities.bind(null, db, listByTagOrder.bind(null,callback)));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser,  community, communityImage, communityId, founder, founderImage, files, db, callback) {
    if (community === undefined) {
      callback (Errors.missingInput('community'));
      return;
    }
    if (communityId !== undefined) {
      community.id = communityId;
    }

    if (founder === undefined) {
      if (community.id === undefined) {
        //cannot create a new community without a founder
        callback (Errors.missingInput('founder'));
        return;
      }
    } else {
      founder.hasImage = !!founderImage;
    }

    community.hasImage = !!communityImage;

    if (community.id !== undefined) {
      update (authUser, community, communityImage, founder, founderImage, files, db, callback);
    } else if (!community || community.name === undefined) {
      callback (Errors.missingInput('community.name'));
    } else {
      add (authUser,  community, communityImage, founder, founderImage, files, db, callback);
    }
  }

  function add (authUser,  community, communityImage, founder, founderImage, files, db, callback) {
    if (!founder || founder.name === undefined) {
      callback (Errors.missingInput('founder.name'));
      return;
    }
    community = db.community.model.getNew( community );
    founder =  db.membership.model.getNew( founder );
    founder.userId = authUser.id;
    var tasks = {
      existingCommunity: { table:db.community, load:{ name : community.name}, after:sergeant.stopIfFound, finally:sergeant.remove },
      communityWithoutFounder: { table: db.community, data: community, save: true, finally:sergeant.remove  },
      founder: { table: db.membership, data: founder, before: addSetFounderCommunityId, save: true, finally:sergeant.json },
      community: { table: db.community, data: community, before: addUpdateCommunityFounder, save: true, finally:sergeant.json  },
      tags: { table: db.communityTag, data: [], beforeSave: prepTags.bind(null,db), multiple: {}, save: true, finally:sergeant.remove  },
      record: Records.getNewTask(db, db.record.model.type.add)
    };
    sergeant(tasks,
      'existingCommunity,communityWithoutFounder,founder,community,tags,record',
      addSaveImages.bind(null, communityImage, founderImage,  files, callback));
  }

  function addSetFounderCommunityId (data, tasks) {
    tasks.founder.data.communityId = data.communityWithoutFounder.id;
    return true;
  }

  function addUpdateCommunityFounder (data, tasks) {
    tasks.community.data = data.communityWithoutFounder;
    tasks.community.data.founderId = data.founder.id;
    return true;
  }

  function addSaveImages (communityImage, founderImage, files, callback, data) {
    if (data instanceof Error) {
      callback(data);
      return;
    }

    if (founderImage !== undefined) {
      files.set(controllers.profileImage.getImageFilename(data.founder.id), founderImage);
    }
    if (communityImage !== undefined) {
      files.set(controllers.profileImage.getImageFilename(data.community.id), communityImage);
    }
    callback(data);
  }
  function prepTags(db, data, tasks) {
    tagUtils.update(data.tags, data.community.description, data.founder.id, data.community.id,  db.communityTag.model, tasks.tags);
  }

  //------------------------------------------------------------------------------------------------------------------//

  function update (authUser,  community, communityImage, founder, founderImage, files, db, callback) {
    sergeant ({
      founder : { table:db.membership, load: { userId: authUser.id,
                                               communityId: community.id },
        beforeSave: sergeant.and(sergeant.stopIfNotFound,
                                 prepSetFounder.bind(null,founder)),
        finally: sergeant.json },
      loadedCommunity: { table:db.community, load: community.id, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community: { table:db.community, before: prepCommunityUpdate.bind(null, community),
        data: {},  save: true, finally: sergeant.json },
      tags: { table: db.communityTag, before: updateGetTags, beforeSave: prepTags.bind(null,db), multiple: {}, save: true, finally:sergeant.remove  },
      record: Records.getNewTask(db, db.record.model.type.add)
    }, 'founder,loadedCommunity,community,tags,record',
      addSaveImages.bind(null, communityImage, founderImage,  files, callback));
  }

  function prepSetFounder (founderNewDetails, data, tasks) {
    var founder = data.founder;
    // it's ok to update founder details but not his/hers ID
    // if no founderNewDetails is provided, keep existing data
    if (founderNewDetails !== undefined) {
      if (founder.id !== jFounder.id) {
        return (Errors.noPermissions('update-community'));
      } else if (founderNewDetails.name || founderNewDetails.description) {
        if (sergeant.update(founderNewDetails, founder) > 0) {
          tasks.founder.data = founder;
          tasks.founder.save = true;
          return founder.isValid();
        } else {
          data.founder = founder;
          return false;
        }
      }
    }
  }

  function prepCommunityUpdate (jCommunity, data, tasks) {
    var community = data.loadedCommunity;
    if (data.founder.id !== community.founderId) {
      return (Errors.noPermissions('update-community'));
    } else {
      if (sergeant.update(jCommunity, community) > 0) {
        tasks.community.data = community;
        return community.isValid();
      } else {
        data.community = community;
        return false;
      }
    }
  }

  function updateGetTags (data, tasks) {
    tasks.tags.load = { subjectId: data.community.id, memberId: data.founder.id };
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
  module.exports.listByTag = listByTag;
  module.exports.listTop = listTop;
  module.exports.set = set;

})();
