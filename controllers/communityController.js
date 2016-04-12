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
    var unmaskedCommunityId = Encryption.unmask (communityId);
    if (isNaN(unmaskedCommunityId)) {
      callback(Errors.badInput('communityId',communityId));
      return;
    }
    sergeant ({
      founder : { table:db.membership, load: { userId: authUser.id, communityId: unmaskedCommunityId }, after: sergeant.stopIfNotFound },
      loadedCommunity : { table:db.community, load: unmaskedCommunityId, after: sergeant.stopIfNotFound },
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
    var unmaskedCommunityId = Encryption.unmask(communityId);
    if (isNaN(unmaskedCommunityId)) {
      callback(Errors.badInput('communityId',communityId));
      return;
    }

    var tasks = {
      community : { table:db.community, load: unmaskedCommunityId, after: sergeant.stopIfNotFound },
      membership: { table:db.membership, data: null },
      founder: { table:db.membership, data: null, json:true, before: getSetFounderIdFromCommunity }
    };
    if (optionalUser !== undefined) {
      tasks.membership.load = {userId: optionalUser.id, communityId: unmaskedCommunityId };
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
      communities : { table:db.community, load: { status: db.community.model.status.active }, multiple: {}, json: true },
      memberships :  { table: db.membership, data: [], multiple: {}, json: true, after: mapMemberships.bind(null, db) }
    };
    if (optionalUser !== undefined) {
      tasks.memberships.load  = { userId: optionalUser.id, status: db.membership.model.status.active};
    }
    sergeant (tasks, 'communities,memberships', callback);
  }

  function mapMemberships (db, data) {
    var memberships = utils.toMap(data.memberships, 'communityId');
    var secretCommunity = db.community.model.type.secret;
    var communities = data.communities;
    var communityCount = communities.length;
    var communityList = [];

    communities.reverse();
    while (communityCount--) {
      var community = communities[communityCount].toJSON();
      if (community.type !== secretCommunity || memberships[community.id]) {
        communityList[communityList.length] = community;
      }
    }

    data.memberships = memberships;
    data.communities = communityList;
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
      existingCommunity: { table:db.community, load:{ name : community.name}, after:sergeant.stopIfFound},
      community: { table: db.community, data: community, save: true },
      founder: { table: db.membership, data: founder, before: addSetFounderCommunityId, save: true },
      communityWithFounder: { table: db.community, data: community, before: addUpdateCommunityFounder, save: true }
    };
    sergeant(tasks, 'existingCommunity,community,founder,communityWithFounder', addSaveFounderImage.bind(null, founderImage, files, callback));
  }

  function addSetFounderCommunityId (data, tasks) {
    tasks.founder.data.communityId = data.community.id;
    return true;
  }

  function addUpdateCommunityFounder (data, tasks) {
    tasks.communityWithFounder.data = data.community;
    tasks.communityWithFounder.data.founderId = data.founder.id;
    return true;
  }
  function addSaveFounderImage (founderImage, files, callback, data) {
    if (data instanceof Error) {
      callback(data);
      return;
    }
    var founderId = data.founder.id;
    data.community = data.communityWithFounder;
    delete data.existingCommunity;
    delete data.communityWithFounder;
    data = sergeant.toJSON(data);

    if (founderImage !== undefined) {
      controllers.saveProfileImageFile(founderId,founderImage,files,callback.bind(null,data));
    } else {
      callback(data);
    }
  }

  function update (authUser,  community, db, callback) {
    var unmaskedCommunityId = Encryption.unmask(community.id);
    if (isNaN(unmaskedCommunityId)) {
      callback(Errors.badInput('communityId',community.id));
      return;
    }
    sergeant ({
      founder : { table:db.membership, load: { userId: authUser.id, communityId: unmaskedCommunityId }, after: sergeant.stopIfNotFound },
      loadedCommunity: { table:db.community, load: unmaskedCommunityId, after: sergeant.stopIfNotFound },
      community: { table:db.community, data: {},  save: true, before: prepareCommunityUpdate.bind(null, community), json: true }
    }, 'founder,loadedCommunity,community', callback);
  }

  function prepareCommunityUpdate (jCommunity, data, tasks) {
    var community = data.loadedCommunity;
    if (data.founder.id !== community.founderId) {
      return (Errors.noPermissions('update-community'));
    } else {
      delete data.founder;
      delete data.loadedCommunity;
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