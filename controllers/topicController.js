;(function topicControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isImmutable (topic) {
    return topic.opinions > 0 || topic.follow > 0 || topic.endorse > 0 > topic.report > 0;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, topicId, db, callback) {
    sergeant ({
      current : { table:db.topic, load: topicId, after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable), finally: sergeant.remove },
      author: { table:db.membership, before: archiveGetAuthorFromTopic, load: { userId : authUser.id}, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community: { table:db.community, before: archiveGetCommunityFromTopic, beforeSave: sergeant.and(sergeant.stopIfNotFound, archiveUpdateCommunityTopics), save: true, finally: sergeant.minimalJson },
      topic: { table:db.community, beforeSave: archivePrepare.bind(null,db), save: true, finally: sergeant.json }
    },'current,author,community,topic', callback);
  }

  function stopIfImmutable (data) {
    if (isImmutable (data.current)) {
      return Errors.immutable('topic');
    }
  }

  function archiveGetAuthorFromTopic (data, tasks) {
    tasks.author.load.id = data.current.authorId;
  }

  function archiveGetCommunityFromTopic (data, tasks) {
    tasks.community.load = data.current.communityId;
  }

  function archiveUpdateCommunityTopics (data) {
    data.community.topics --;
  }

  function archivePrepare (db, data, tasks ) {
    var topic = data.current;
    topic.status = db.topic.model.status.archived;
    topic.modified = new Date();
    tasks.topic.data = topic;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, topicId, db, files, callback) {
    var tasks = {
      topic: { table: db.topic, load: topicId, after: sergeant.stopIfNotFound, finally: sergeant.json },
      community: { table: db.community, before:getCommunityFromTopic,  after: sergeant.stopIfNotFound, finally: sergeant.remove },
      member: { table: db.membership, before:getMemberFromCommunity.bind(null, optionalUser), after: getCheckPermissions.bind(null, db), finally: sergeant.remove },
      author: { table: db.membership, before:getAuthorFromTopic, after: sergeant.and(sergeant.stopIfNotFound, getCheckAuthorImage.bind(null, files)), finally: sergeant.minimalJson },
      viewpoint: {  table: db.topicViewpoint, before:getPrepareViewpoint, finally: sergeant.minimalJson }
    };

    sergeant ( tasks, 'topic,community,author,member,viewpoint', callback);
  }

  function getCommunityFromTopic (data, tasks) {
    tasks.community.load = data.topic.communityId;
  }

  function getMemberFromCommunity (optionalUser, data, tasks) {
    if (optionalUser) {
      tasks.member.load = { userId: optionalUser.id, communityId: data.community.id };
    }
  }

  function getAuthorFromTopic (data, tasks) {
    tasks.author.load = data.topic.authorId;
  }

  function getPrepareViewpoint (data, tasks) {
    if (data.member) {
      tasks.viewpoint.load = { subjectId:data.topic.id, memberId: data.member.id };
    }
  }

  function getCheckPermissions (db, data) {
    if (!(data.member || data.community.type !== db.community.model.type.exclusive)) {
      return Errors.noPermissions('get-topic');
    }
  }

  function getCheckAuthorImage (files, data) {
    data.author.hasImage = controllers.profileImage.existsSync (files, data.author.id);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, communityId, db, callback) {
    var tasks = {
      community: { table: db.community, load: communityId, after: sergeant.stopIfNotFound, finally: sergeant.jsonMap },
      topics: { table: db.topic, load: { communityId: communityId, status: db.topic.model.status.published},
        multiple: {order: '-modified'}, finally: sergeant.fullJson },
      authors: { table: db.membership, before: prepareAuthorsQuery, multiple: {},
        finally: sergeant.jsonMap },
      member: { table: db.membership, before: prepareMemberQuery.bind(null, optionalUser),
        after: listOnlyIfHasPermissions.bind (null,db.community.model.type.exclusive), finally: sergeant.remove },
      viewpoints: { table: db.topicViewpoint, before: listPrepareViewpointsQuery, multiple: {},
        finally: sergeant.jsonMap.bind (null,'subjectId')}
    };

    sergeant (tasks, 'community,topics,authors,member,viewpoints', callback);
  }

  function prepareAuthorsQuery (data, tasks) {
    var topics = data.topics;
    var topicCount = topics.length;
    if (topicCount) {
      var authors = {}; // we need to find distinct authors!
      while (topicCount--) {
        authors[topics[topicCount].authorId] = true;
      }
      tasks.authors.load = { id: Object.keys(authors) };
    }
  }

  function prepareMemberQuery (optionalUser, data, tasks) {
    if (optionalUser) {
      tasks.member.load = { userId: optionalUser.id, communityId: data.community.id };
    }
  }

  function listOnlyIfHasPermissions (communityTypeExclusive, data, tasks) {
    return (data.member || data.community.type !== communityTypeExclusive) ? true : Errors.noPermissions('list-topics') ;
  }

  function listPrepareViewpointsQuery (data, tasks) {
    if (data.member) {
      var items = data.topics;
      var itemCount = items.length;
      if (itemCount) {
        var itemIds = []; // we need to find distinct authors!
        while (itemCount--) {
          itemIds[itemCount] = items[itemCount].id;
        }
        tasks.viewpoints.load = { memberId: data.member.id, subjectId: itemIds};
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, communityId, topicId, topic, db, callback) {
    if (communityId !== undefined) {
      topic.communityId = communityId;
    }
    if (topicId !== undefined) {
      topic.id = topicId;
    }

    topic.content = validators.sanitizeString(topic.content);

    if (topic.id !== undefined) {
      update (authUser, topic, db, callback);
    } else if (topic.communityId !== undefined) {
      add (authUser, topic, db, callback);
    } else {
      callback (Errors.missingInput('membership.communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (authUser, topic, db, callback) {
    sergeant ({
      author: { table: db.membership, load: { userId: authUser.id, communityId: topic.communityId }, after: sergeant.and(sergeant.stopIfNotFound,setCheckPermissions), finally: sergeant.minimalJson },
      community: { table: db.community, load: topic.communityId, beforeSave:sergeant.and(sergeant.stopIfNotFound, addCheckTopicLength.bind(null, topic.content)), save: true, finally: sergeant.minimalJson  },
      topic: { table: db.topic, before: addPrepareTopic.bind(null, topic,db), save: true, finally: sergeant.json}
    }, 'community,author,topic', callback);
  }

  function setCheckPermissions (data) {
    return data.author.can ('suggest') ? true : Errors.noPermissions('suggest');
  }

  function addCheckTopicLength (string, data) {
    data.community.topics++;
    if (!data.community.isTopicLengthOk(string)) {
      return Errors.tooLong('topic',string);
    } else if (string.length === 0) {
      return Errors.tooShort('topic',string);
    }
    return  true;
  }

  function addPrepareTopic (topic, db, data, tasks) {
    topic.authorId = data.author.id;
    topic.communityId = data.community.id;
    topic = db.topic.model.getNew( topic );
    tasks.topic.data = topic;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, topic, db, callback) {
    sergeant ({
      existing: { table:db.topic, load: topic.id, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community: { table:db.community, before:updatePrepareCommunity, after: sergeant.stopIfNotFound, finally: sergeant.minimalJson },
      author: { table:db.membership, before:updatePrepareAuthor, load: { userId: authUser.id}, after: sergeant.and(sergeant.stopIfNotFound, isPostBelongsToAuthor), finally: sergeant.minimalJson },
      topic: {table:db.topic, beforeSave: updatePrepareTopic.bind(null, topic), save: true, finally: sergeant.json }
    }, 'existing,community,author,topic', callback);
  }

  function updatePrepareCommunity (data, tasks) {
    tasks.community.load = data.existing.communityId;
  }
  function updatePrepareAuthor (data, tasks) {
    tasks.author.load = data.existing.authorId;
  }

  function isPostBelongsToAuthor(data) {
    return data.author.can ('suggest') ? true : Errors.noPermissions('suggest');
  }

  function updatePrepareTopic (jTopic, data, tasks) {
    var topic = data.existing;
    sergeant.update(jTopic, topic);

    if (isImmutable(topic)) {
      return Errors.immutable('topic');
    } else if (!data.community.isTopicLengthOk(topic.content)) {
      return Errors.tooLong('topic-content');
    }

    topic.modified = new Date();
    tasks.topic.data = topic;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};
  function setControllers (controllerMap) {
    controllers = controllerMap;
  }
  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.archive = archive;
  module.exports.get = get;
  module.exports.list = list;
  module.exports.set = set;
})();
