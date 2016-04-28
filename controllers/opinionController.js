;(function opinionControllerEnclosure() {
  'use strict';

  var Encryption = require('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive(authUser, opinionId, db, callback) {
    sergeant({
        current: {table: db.opinion, load: opinionId, after: sergeant.stopIfNotFound, finally: sergeant.remove},
        author: {
          table: db.membership,
          before: archivePrepareAuthorQuery,
          load: {userId: authUser.id},
          after: sergeant.stopIfNotFound,
          finally: sergeant.remove
        },
        community: {
          table: db.community,
          before: archivePrepareCommunityQuery,
          after: sergeant.stopIfNotFound,
          finally: sergeant.remove
        },
        topic: {
          table: db.topic,
          before: archivePrepareTopicQuery,
          beforeSave: archiveUpdateTopicCount,
          save: true,
          after: sergeant.stopIfNotFound,
          finally: sergeant.minimalJson
        },
        opinion: {
          table: db.opinion,
          beforeSave: archiveUpdateOpinion.bind(null, db),
          save: true,
          after: sergeant.stopIfNotFound,
          finally: sergeant.json
        }
      },
      'current,author,community,topic,opinion', callback);
  }

  function archivePrepareAuthorQuery(data, tasks) {
    tasks.author.load.id = data.current.authorId;
  }

  function archivePrepareCommunityQuery(data, tasks) {
    tasks.community.load = data.current.communityId;
  }

  function archivePrepareTopicQuery(data, tasks) {
    tasks.topic.load = data.current.topicId;
  }

  function archiveUpdateTopicCount(data) {
    data.topic.opinions--;
  }

  function archiveUpdateOpinion(db, data) {
    var opinion = data.current;
    opinion.status = db.comment.model.status.archived;
    opinion.modified = new Date();
    data.opinion = opinion;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get(optionalUser, opinionId, db, files, callback) {
    var tasks = {
      opinion: {table: db.opinion, load: opinionId, after: sergeant.stopIfNotFound, finally: sergeant.json},
      community: {
        table: db.community,
        before: getUpdateCommunityQuery,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove
      },
      member: {table: db.membership, after: checkPermission.bind(null, 'get-opinion', db), finally: sergeant.remove},
      author: {
        table: db.membership,
        before: getUpdateAuthorQuery,
        after: sergeant.and(sergeant.stopIfNotFound, getCheckAuthorImage.bind(null, files)),
        finally: sergeant.minimalJson
      },
      history: {
        table: db.opinion,
        before: getUpdateHistoryQuery,
        load: { status: db.opinion.model.status.history },
        multiple: {order: 'modified'},
        finally: sergeant.json
      },
      viewpoint: {table: db.opinionViewpoint, finally: sergeant.minimalJson}
    };
    if (optionalUser) {
      tasks.member.load = {userId: optionalUser.id};
      tasks.member.before = getUpdateMemberQuery;
      tasks.viewpoint.before = getUpdateViewpointQuery;
    }
    sergeant(tasks, 'opinion,community,history,author,member,viewpoint', callback);
  }

  function getUpdateCommunityQuery(data, tasks) {
    tasks.community.load = data.opinion.communityId;
  }

  function getUpdateAuthorQuery(data, tasks) {
    tasks.author.load = data.opinion.authorId;
  }

  function getCheckAuthorImage(files, data) {
    data.hasImage = controllers.profileImage.existsSync(files, data.author.id);
  }
  function getUpdateHistoryQuery (data, tasks) {
    tasks.history.load.authorId = data.opinion.authorId;
    tasks.history.load.topicId = data.opinion.topicId;
  }

  function getUpdateMemberQuery(data, tasks) {

    tasks.member.parameters.communityId = data.opinion.communityId;
  }

  function getUpdateViewpointQuery(data, tasks) {
    if (data.member) {
      tasks.viewpoint.load = {opinionId: data.opinion.id, membershipId: data.member.id};
    }
  }


  function checkPermission(actionName, db, data) {
    if (!(data.member || data.community.type !== db.community.model.type.exclusive)) {
      return Errors.noPermissions(actionName);
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list(optionalUser, topicId, db, callback) {
    var status = db.opinion.model.status;
    var tasks = {
      topic: {table: db.topic, load: topicId, after: sergeant.stopIfNotFound, finally: sergeant.remove},
      community: {
        table: db.community,
        before: listPrepareCommunityQuery,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove
      },
      member: { table: db.membership, after: checkPermission.bind(null, 'list-opinions', db)},
      opinions: {
        table: db.opinion,
        before: listPrepareOpinionsQuery.bind(null, status),
        load: { topicId: topicId, status: [status.published, status.history]}, multiple: {order: 'modified'},
        after: listSeparateHistory.bind(null, status), finally: sergeant.fullJson },
      history: { table: db.opinion, finally: sergeant.jsonGroup.bind(null,'authorId') },
      draft: { finally: sergeant.fullJson },
      authors: { table: db.membership, before: listPrepareAuthorsQuery, multiple: {},
        finally: sergeant.jsonMap},
      viewpoints: { table: db.opinionViewpoint, multiple: {}, finally: sergeant.jsonMap}
    };

    if (optionalUser !== undefined) {
      tasks.member.load = { userId: optionalUser.id };
      tasks.member.before = listPrepareMemberQuery;
      tasks.viewpoints.before = listPrepareViewpointQuery;
    }
    sergeant(tasks, 'topic,community,member,opinions,history,draft,authors,viewpoints', callback);
  }

  function listPrepareCommunityQuery(data, tasks) {
    tasks.community.load = data.topic.communityId;
  }

  function listPrepareMemberQuery(data, tasks) {
    tasks.member.load.communityId = data.community.id;
  }

  function listPrepareViewpointQuery(data, tasks) {
    var member = data.member;
    if (member) {
      var opinions = data.opinions;
      var count = opinions.length;
      if (count) {
        var opinionIds = [];
        while (count--) {
          opinionIds[count] = opinions[count].id;
        }
        tasks.viewpoints.load = {id: opinionIds, memberId: member.id};
      }
    }
  }

  function listPrepareOpinionsQuery(status, repository, tasks) {
    var member = repository.member;
    if (member) {
      tasks.opinions.load.or = [{status: tasks.opinions.load.status}, {status: status.draft, authorId: member.id}];
      delete tasks.opinions.load.status;
    }
  }

  function listPrepareAuthorsQuery(data, tasks) {
    var opinions = data.opinions;
    var count = opinions.length, authorIdMap = {};
    if (count > 0) {
      while (count--) {
        authorIdMap[opinions[count].authorId] = true;
      }
      tasks.authors.load = {id: Object.keys(authorIdMap)};
    }
  }

  function listSeparateHistory(status, data) {
    var drafts = [];
    var history = [];
    var published = [];
    var opinions = data.opinions;
    var count = opinions.length;
    while (count--) {
      var opinion = opinions[count];
      switch (opinion.status) {
        case status.published:
          published[published.length] = opinion;
          break;
        case status.history:
          history[history.length] = opinion;
          break;
        case status.draft:
          drafts[drafts.length] = opinion;
          break;
      }
    }
    data.draft = drafts;
    data.history = history;
    data.opinions = published;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set(authUser, topicId, opinionId, opinion, db, callback) {
    if (topicId !== undefined) {
      opinion.topicId = topicId;
    }
    if (opinionId !== undefined) {
      opinion.id = opinionId;
    }

    opinion.content = validators.sanitizeString(opinion.content);
    opinion = db.opinion.model.getNew(opinion);

    if (opinion.id !== undefined) {
      update(authUser, opinion, db, callback);
    } else if (opinion.topicId !== undefined) {
      add(authUser, opinion, db, callback);
    } else {
      callback(Errors.missingInput('membership.topicId'));
    }
  }

  function setOpinion (data, tasks) {
    var opinion = tasks.opinion.data;
    opinion.communityId = data.community.id;
    opinion.authorId = data.author.id;
    opinion.topicId = data.topic ? data.topic.id : data.current.topicId;
  }

  function setHistoryQuery (data, tasks) {
    tasks.history.load.authorId = data.author.id;
    tasks.history.load.topicId = data.opinion.topicId;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add(authUser, opinion, db, callback) {
    var status = db.opinion.model.status;

    var tasks = {
      topic: { table: db.topic, load: opinion.topicId, after: sergeant.stopIfNotFound, finally: sergeant.minimalJson},
      community: { table: db.community, before: addPrepareCommunityQuery,
        after: sergeant.and(sergeant.stopIfNotFound, addCheckOpinionLength.bind(null, opinion.content)),
        finally: sergeant.remove },
      author: { table: db.membership, before: addPrepareAuthorQuery, load: {userId: authUser.id},
        after: sergeant.and(sergeant.stopIfNotFound, authorCanOpinion), finally: sergeant.remove },
      current: { table: db.opinion, before: addPrepareCurrentQuery, load: { status: status.published},
        beforeSave: addUpdateCurrentOpinion.bind(null, status),
        finally: sergeant.remove },
      opinion: { table: db.opinion, data: opinion,
        beforeSave: setOpinion, save: true, finally: sergeant.json },
      updateTopic: { table: db.topic, beforeSave: addUpdateTopic, finally: sergeant.remove },
      history: { table: db.opinion, before: setHistoryQuery, load: { status: status.history },
        multiple: { order: 'modified'}, finally: sergeant.json }
    };
    sergeant(tasks, 'topic,community,author,current,opinion,updateTopic,history', callback);
  }

  function addPrepareCommunityQuery(data, tasks) {
    tasks.community.load = data.topic.communityId;
  }

  function addPrepareAuthorQuery(data, tasks) {
    tasks.author.load.communityId = data.topic.communityId;
  }

  function addPrepareCurrentQuery(data, tasks) {
    tasks.current.load.topicId = data.topic.id;
  }

  function authorCanOpinion(data) {
    return data.author.can('opinionate') ? true : Errors.noPermissions('opinionate');
  }

  function addCheckOpinionLength(string, data) {
    return data.community.isOpinionLengthOk(string) ? true : Errors.tooLong('opinion', string);
  }

  function addUpdateCurrentOpinion (status, data, tasks) {
    var current = data.current;
    if (current) {
      current.status = status.history;
      tasks.current.data = current;
      tasks.current.save = true;
    }
  }

  function addUpdateTopic (data, tasks) {
    if (!data.current) {
      var topic = data.topic;
      topic.opinions++;
      topic.modified = new Date();
      tasks.updateTopic.data = topic;
      tasks.updateTopic.save = true;
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update(authUser, opinion, db, callback) {
    var status = db.opinion.model.status;
    var tasks = {
      current: { table: db.opinion, load: opinion.id,
        beforeSave: sergeant.stopIfNotFound, finally: sergeant.remove },
      community: { table: db.community, before: updateSetCommunityQuery,
        after: sergeant.stopIfNotFound, finally: sergeant.remove},
      author: { table: db.membership, before: updateSetAuthorQuery, load: { userId: authUser.id },
        after: sergeant.and(sergeant.stopIfNotFound, authorCanOpinion), finally: sergeant.remove},
      updateCurrent: { table: db.opinion, before: updateSetCurrentQuery.bind(null, status),
        beforeSave: updateSetCurrent.bind(null, status) ,save:true, finally: sergeant.remove},
      opinion: { table: db.opinion, data: opinion,
        beforeSave: setOpinion, save: true, finally: sergeant.json },
      history: { table: db.opinion, before: setHistoryQuery, load: { status: status.history},
        multiple: { order: 'modified'}, finally: sergeant.json }
    };
    sergeant(tasks, 'current,community,author,updateCurrent,opinion,history', callback);
  }

  function updateSetCommunityQuery (data, tasks) {
    tasks.community.load = data.current.communityId;
  }
  function updateSetAuthorQuery (data, tasks) {
    tasks.author.load.id = data.current.authorId;
  }

  function updateSetCurrentQuery (status, data, tasks) {
    var current = data.current;
    if (current.status === status.published) {
      data.updateCurrent = current;
    } else {
      tasks.updateCurrent.load = { authorId: current.authorId, topicId: current.topicId, status: status.published };
    }
  }

  function updateSetCurrent (status, data, tasks) {
    var current = data.updateCurrent;
    current.status = status.history;
    current.modified = new Date();
    tasks.updateCurrent.data = current;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};

  function setControllers(controllerMap) {
    controllers = controllerMap;
  }

  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.archive = archive;
  module.exports.get = get;
  module.exports.list = list;
  module.exports.set = set;
})();