;(function communityRoutesEnclosure() {
  'use strict';
  var sergeant = require('../helpers/sergeant.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var Encryption = require('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var validators = require('../helpers/validators.js');
  var utils = require('../helpers/modelUtils.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, communityId, db, callback) {
    sergeant ({
      founder : { table:db.membership, load: { userId: authUser.id, communityId: communityId }, after: sergeant.stopIfNotFound },
      loadedCommunity : { table:db.community, load: communityId, after: sergeant.stopIfNotFound },
      community : { table:db.community, save: true, before: prepareCommunityArchive.bind(null,db), after: prepareArchiveOutput }},
      'founder,loadedCommunity,community', callback);
  }

  function prepareCommunityArchive (db, data, tasks) {
    if (data.founder.id !== data.loadedCommunity.founderId) {
      return Errors.noPermissions('archive-community');
    }
    var community = data.loadedCommunity;
    community.status = db.community.model.status.archived;
    community.modified = new Date();
    tasks.community.data = community;
    return true;
  }

  function prepareArchiveOutput (data) {
    delete data.founder;
    delete data.loadedCommunity;
    data.community = data.community.toJSON();
    return true;
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
      communities : { table:db.community, load: { status: db.community.model.status.active }, multiple: {}, finally: sergeant.json },
      memberships : { table: db.membership, multiple: {}, finally: sergeant.jsonMap.bind(null,'communityId') }
    };
    if (optionalUser !== undefined) {
      tasks.memberships.load  = { userId: optionalUser.id, status: db.membership.model.status.active};
    }
    sergeant (tasks, 'communities,memberships', filterSecretCommunities.bind(null, db, callback));
  }

  function filterSecretCommunities (db, callback, data) {
    var communities = data.communities;
    var memberships = data.memberships;
    var secretCommunity = db.community.model.type.secret;
    var communityList = [];

    communities.reverse();
    while (communities.length) {
      var community = communities.pop();
      if (community.type !== secretCommunity || memberships[community.id]) {
        communityList[communityList.length] = community;
      }
    }
    data.communities = communityList;

    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser,  community, communityId, founder, founderImage, files, db, callback) {
    if (communityId !== undefined) {
      community.id = communityId;
    }

    if (community.id !== undefined) {
      update (authUser, community, db, callback);
    } else if (!community || community.name === undefined) {
      callback (Errors.missingInput('community.name'));
    } else {
      add (authUser,  community, founder, founderImage, files, db, callback);
    }
  }

  function add (authUser,  community, founder, founderImage, files, db, callback) {
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
      community: { table: db.community, data: community, before: addUpdateCommunityFounder, save: true, finally:sergeant.json  }
    };
    sergeant(tasks, 'existingCommunity,communityWithoutFounder,founder,community', addSaveFounderImage.bind(null, founderImage, files, callback));
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
  function addSaveFounderImage (founderImage, files, callback, data) {
    if (data instanceof Error) {
      callback(data);
      return;
    }

    if (founderImage !== undefined) {
      controllers.saveProfileImageFile(data.founder.id,founderImage,files,callback.bind(null,data));
    } else {
      callback(data);
    }
  }

  function update (authUser,  community, db, callback) {
    sergeant ({
      founder : { table:db.membership, load: { userId: authUser.id, communityId: community.id }, after: sergeant.stopIfNotFound, finally: sergeant.json },
      loadedCommunity: { table:db.community, load: community.id, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community: { table:db.community, data: {},  save: true, before: prepareCommunityUpdate.bind(null, community), finally: sergeant.json }
    }, 'founder,loadedCommunity,community', callback);
  }

  function prepareCommunityUpdate (jCommunity, data, tasks) {
    var community = data.loadedCommunity;
    if (data.founder.id !== community.founderId) {
      return (Errors.noPermissions('update-community'));
    } else {
      if (sergeant.update(jCommunity, community) > 0) {
        tasks.community.data = community;
        return community.isValid();
      } else {
        return false;
      }
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