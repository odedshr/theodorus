;(function topicControllerEnclosure() {
  'use strict';

  var sergeant = require('../helpers/sergeant.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');
  var modelUtils = require('../helpers/modelUtils.js');
  var tagUtils = require('../helpers/tagUtils.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var Records = require('../helpers/RecordManager.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isImmutable (topic) {
    return topic.opinions > 0 || topic.follow > 0 || topic.endorse > 0 > topic.report > 0;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, topicId, db, callback) {
    sergeant ({
      existing : { table:db.topic, load: topicId, after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable), finally: sergeant.remove },
      author: { table:db.membership, before: archiveGetAuthorFromTopic, load: { userId : authUser.id}, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community: { table:db.community, before: archiveGetCommunityFromTopic, beforeSave: sergeant.and(sergeant.stopIfNotFound, archiveUpdateCommunityTopics), save: true, finally: sergeant.minimalJson },
      topic: { table:db.community, beforeSave: archivePrepare.bind(null,db), save: true, finally: sergeant.json },
      record: Records.getNewTask(db, db.record.model.type.archive)
    },'existing,author,community,topic,record', callback);
  }

  function stopIfImmutable (data) {
    if (isImmutable (data.existing)) {
      return Errors.immutable('topic');
    }
  }

  function archiveGetAuthorFromTopic (data, tasks) {
    tasks.author.load.id = data.existing.authorId;
  }

  function archiveGetCommunityFromTopic (data, tasks) {
    tasks.community.load = data.existing.communityId;
  }

  function archiveUpdateCommunityTopics (data) {
    data.community.topics --;
  }

  function archivePrepare (db, data, tasks ) {
    var topic = data.existing;
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
        multiple: { order: '-modified' }, finally: sergeant.fullJson },
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
    if (data.topics.length > 0) {
      tasks.authors.load = { id: modelUtils.toVector(data.topics,'authorId') };
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
    if (data.member && data.topics.length > 0) {
      tasks.viewpoints.load = { memberId: data.member.id, subjectId: modelUtils.toVector(data.topics,'id') };
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listByTag (optionalUser, tags, db, callback) {
    var tagList = tags.match(/[a-z\d][\w-]*/g);
    var tasks = {
      tags: { table: db.topicTag, load: { value: tagList }, multiple: {},
        after: sergeant.stopIfNotFound, finally: sergeant.json },
      topics: { table: db.topic, before: listByTagTopicQuery, load: { status: db.topic.model.status.published },
        multiple: { order: '-score' }, finally: sergeant.fullJson },
      communities: { table: db.community, before: listByTagCommunityQuery,
        load: { status: db.community.model.status.active}, multiple: {},
        after: sergeant.stopIfNotFound, finally: sergeant.jsonMap },
      authors: { table: db.membership, before: prepareAuthorsQuery, multiple: {},
        finally: sergeant.jsonMap },
      memberships: { table: db.membership, before: listByTagMembershipQuery.bind(null, optionalUser),
        after: listByTagFilterTopics.bind (null,db.community.model.type.exclusive), finally: sergeant.remove },
      viewpoints: { table: db.topicViewpoint, before: listByTagViewpointsQuery, multiple: {},
        finally: sergeant.jsonMap.bind (null,'subjectId')}
    };
    sergeant (tasks, 'tags,topics,communities,authors,memberships,viewpoints', listByTagOrder.bind(null, callback));
  }

  function listByTagTopicQuery (data, tasks) {
    var topicIds = modelUtils.toVector(data.tags,'subjectId');
    if (topicIds.length === 0) {
      return Errors.notFound('tags',JSON.stringify(tasks.tags.load));
    }
    tasks.topics.load.id = topicIds;
  }

  function listByTagCommunityQuery (data, tasks) {
    var communities = modelUtils.toVector(data.topics,'communityId');
    if (communities.length === 0) {
      return Errors.notFound('tags',JSON.stringify(tasks.tags.load));
    }
    tasks.communities.load.id = communities;
  }

  function listByTagMembershipQuery (optionalUser, data, tasks) {
    if (optionalUser) {
      tasks.memberships.load = { userId: optionalUser.id, communityId: tasks.communities.load.id };
    }
  }

  function listByTagFilterTopics (communityTypeExclusive, data, tasks) {
    var topic, topics = data.topics, keep = [];
    var community, communityMap = modelUtils.toMap(data.communities);
    var membershipMap = modelUtils.toMap(data.memberships, 'communityId');
    for (var i = 0, length = topics.length; i < length; i++) {
      topic = topics[i];
      community = communityMap[topic.communityId];
      if ( community.type !== communityTypeExclusive || membershipMap[community.id]) {
        keep.push (topic);
      }
    }
    data.topics = keep;
  }

  function listByTagViewpointsQuery (data, tasks) {
    var memberships = data.memberships;
    if (memberships && memberships.length > 0) {
      if (data.topics.length > 0) {
        tasks.viewpoints.load = { memberId: modelUtils.toVector(memberships,'id'), subjectId: modelUtils.toVector(data.topics,'id') };
      }
    }
  }

  function compareTopicsByTag (tags, a, b) {
    var tagCount = tags[a.id].length - tags[b.id].length;
    return tagCount ? tagCount : ((a.modified < b.modified) ? -1 :1);
  }

  function listByTagOrder (callback, data) {
    if (data.tags) {
      data.tags = tagUtils.getRelevantSubjectIdMap(data.tags, data.topics);
      data.topics.sort(compareTopicsByTag.bind(null, data.tags));
    }
    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listTags (count, page, db, callback) {
    var tasks = {
      tags: { table: db.tag, load: {}, multiple: getMultipleParameters(count, page, 'id'),
        finally: listTagsPrepareMap }
    };
    sergeant (tasks, 'tags', callback);
  }

  function listTagsPrepareMap (data) {
    var tag, tags = data.tags, map = {};
    for (var i = 0, length = tags.length; i < length; i++) {
      tag = tags[i];
      map[tag.id] = tag.count;
    }
    data.tags = map;
  }

  function getMultipleParameters(limit, offset, order) {
    var map = { order: order};
    limit = +limit;
    offset = +offset;
    if (limit>0) {
      map.limit = limit;
      if (offset>0) {
        map.offset = (offset - 1) * limit;
      }
    }
    return map;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listTop (optionalUser, count, page, db, callback) {
    var tasks = {
      topics: { table: db.topic, load: { status: db.topic.model.status.published},
        multiple: getMultipleParameters(count, page, '-score'), finally: sergeant.fullJson },
      communities: { table: db.community, before: listByTagCommunityQuery,
        load: { status: db.community.model.status.active}, multiple: {},
        after: sergeant.stopIfNotFound, finally: sergeant.jsonMap },
      authors: { table: db.membership, before: prepareAuthorsQuery, multiple: {},
        finally: sergeant.jsonMap },
      memberships: { table: db.membership, before: listByTagMembershipQuery.bind(null, optionalUser),
        after: listByTagFilterTopics.bind (null,db.community.model.type.exclusive), finally: sergeant.remove },
      viewpoints: { table: db.topicViewpoint, before: listByTagViewpointsQuery, multiple: {},
        finally: sergeant.jsonMap.bind (null,'subjectId')}
    };
    sergeant (tasks, 'topics,communities,authors,memberships,viewpoints', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, communityId, topicId, topic, images, db, files, callback) {
    if (communityId !== undefined) {
      topic.communityId = communityId;
    }
    if (topicId !== undefined) {
      topic.id = topicId;
    }

    topic.content = validators.sanitizeString(topic.content);

    if (topic.id !== undefined) {
      update (authUser, topic, images, db, files, callback);
    } else if (topic.communityId !== undefined) {
      add (authUser, topic, images, db, files, callback);
    } else {
      callback (Errors.missingInput('membership.communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (authUser, topic, images, db, files, callback) {
    sergeant ({
      author: { table: db.membership, load: { userId: authUser.id, communityId: topic.communityId },
        after: sergeant.and(sergeant.stopIfNotFound,setCheckPermissions), finally: sergeant.minimalJson },
      community: { table: db.community, load: topic.communityId,
        beforeSave:sergeant.and(sergeant.stopIfNotFound,
                                verifyStrLenAndUpdateCommunity.bind(null, topic.content),
                                addIncTopicCount),
        save: true, finally: sergeant.minimalJson  },
      topic: { table: db.topic, before: addPrepareTopic.bind(null, topic, images, files, db),
        save: true, finally: sergeant.json },
      tags: { table: db.topicTag, data: [], beforeSave: prepareTags.bind(null,db), multiple: {}, save: true, finally:sergeant.remove  },
      record: Records.getNewTask(db, db.record.model.type.add)
    }, 'community,author,topic,tags,record', callback);
  }

  function setCheckPermissions(data) {
    return data.author.can ('suggest') ? true : Errors.noPermissions('suggest');
  }

  function verifyStrLenAndUpdateCommunity(string, data) {
    var community = data.community;
    community.modified = new Date();
    if (!community.isTopicLengthOk(string)) {
      return Errors.tooLong('topic',string);
    } else if (string.length === 0) {
      return Errors.tooShort('topic',string);
    }
    return  true;
  }

  function addIncTopicCount(data,tasks) {
    data.community.topics++;
  }

  function addPrepareTopic (topic, images, files, db, data, tasks) {
    topic.authorId = data.author.id;
    topic.communityId = data.community.id;
    topic = db.topic.model.getNew( topic );
    controllers.attachment.set(images, files, topic);
    tasks.topic.data = topic;
  }

  function prepareTags(db, data, tasks) {
    tagUtils.update(data.tags, data.topic.content, data.author.id, data.topic.id,  db.topicTag.model, tasks.tags);
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, topic, images, db, files, callback) {
    sergeant ({
      existing: { table:db.topic, load: topic.id, after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable),
        finally: sergeant.remove },
      author: { table:db.membership, before:updatePrepareAuthor, load: { userId: authUser.id},
        after: sergeant.and(sergeant.stopIfNotFound, isPostBelongsToAuthor), finally: sergeant.minimalJson },
      community: { table:db.community, before:updatePrepareCommunity,
        beforeSave:sergeant.and(sergeant.stopIfNotFound,
          verifyStrLenAndUpdateCommunity.bind(null, topic.content)), finally: sergeant.minimalJson },
      topic: {table:db.topic, beforeSave: updatePrepareTopic.bind(null, topic, images, files), save: true,
        finally: sergeant.json },
      tags: { table: db.communityTag, before: updateGetTags, beforeSave: prepareTags.bind(null,db), multiple: {}, save: true, finally:sergeant.remove  },
      record: Records.getNewTask(db, db.record.model.type.archive)
    }, 'existing,author,community,topic,tags,record', callback);
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

  function updatePrepareTopic(jTopic, images, files, data, tasks) {
    var topic = data.existing;
    sergeant.update(jTopic, topic);

    controllers.attachment.set(images, files, topic);
    topic.modified = new Date();
    tasks.topic.data = topic;
  }

  function updateGetTags (data, tasks) {
    tasks.tags.load = { subjectId: data.topic.id, memberId: data.author.id };
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
  module.exports.listByTag = listByTag;
  module.exports.listTags = listTags;
  module.exports.listTop = listTop;
  module.exports.set = set;
})();
