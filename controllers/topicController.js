;(function topicControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var chain = require('../helpers/chain.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isImmutable (topic) {
    return topic.opinions > 0 || topic.follow > 0 || topic.endorse > 0 > topic.report > 0;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, topicId, db, callback) {
    var unmaskedTopicId = Encryption.unmask (topicId);
    if (isNaN(unmaskedTopicId)) {
      callback(Errors.badInput('topicId',topicId));
      return;
    }
    chain.load ({ topic : { table:db.topic, parameters: unmaskedTopicId, continueIf: archiveUpdateAuthorQuery },
                  author: { table:db.membership, parameters: { userId : authUser.id}, continueIf: chain.onlyIfExists },
                  community: { table:db.community, parameters: {}, continueIf: chain.onlyIfExists }},
      ['topic', 'author', 'community'], archiveOnDataLoaded.bind(null, authUser.id, db, callback), callback);
  }

  function archiveUpdateAuthorQuery (repository, tasks) {
    if (repository.topic) {
      tasks.authors.parameters.authorId = repository.topic.authorId;
      tasks.community.parameters = repository.topic.communityId;
    }
    return (repository.topic !== null);
  }

  function archiveOnDataLoaded (db, callback, data) {
    var topic = data.topic;
    if (isImmutable (topic)) {
      callback(Errors.immutable('topic'));
      return;
    }

    topic.status = db.topic.model.status.archived;
    topic.modified = new Date();
    topic.save(chain.andThenPass('topic',callback));

    var community = data.community;
    community.topics--;
    community.save(callback ? callback :chain.andThenNothing);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, topicId, db, files, callback) {
    var tasks = {
      topic: { table: db.topic, parameters: Encryption.unmask(topicId), continueIf: getAddTopicToQueries },
      community: { table: db.community, continueIf: chain.onlyIfExists },
      author: { table: db.author, continueIf: chain.onlyIfExists },
      member: { table: db.membership, data: null },
      viewpoint: {  table: db.topicViewpoint, data: null }
    };
    if (optionalUser) {
      tasks.member.parameters = { userId: optionalUser.id };
      delete tasks.member.data;
    }
    chain.load ( tasks, ['topic','community','author','member','viewpoint'], getOnDataLoaded.bind(null, db ,files, callback));
  }

  function getAddTopicToQueries (repository, tasks) {
    var topic = repository.topic;
    if (topic === null) {
      return false;
    }
    tasks.community.parameters = topic.communityId;
    tasks.author.parameters = topic.authorId;
    tasks.member.parameters.communityId = topic.communityId;
    tasks.member.continueIf = addMemberToViewpointQuery ;
    tasks.viewpoint.parameters = { topicId: topic.id };
    return true;
  }

  function addMemberToViewpointQuery (repository, tasks) {
    var member = repository.member;
    if (member !== null) {
      tasks.viewpoint.parameters.memberId = member.id;
    }
    return true;
  }

  function getOnDataLoaded (db, files, callback, data) {
    if (data.member || data.community.type !== db.community.model.type.exclusive) {
      callback({
        topic: data.topic.toJSON(),
        author: data.author.toMinJSON(),
        hasImage: controllers.profileImage.existsSync (files,data.author.id),
        community: data.community.toMinJSON(),
        viewpoint: data.viewpoint.toJSON()
      });
    } else {
      callback (Errors.noPermissions('get-topic'));
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, communityId, db, callback) {
    var communityUnmaskedId = Encryption.unmask(communityId);
    if (isNaN(communityUnmaskedId)) {
      callback(Errors.badInput('communityId',communityId));
      return;
    }

    var tasks = {
      community: { table: db.community, parameters: communityUnmaskedId, continueIf: chain.onlyIfExists },
      topics: { table: db.topic, parameters: {communityId: communityUnmaskedId, status: db.topic.model.status.published}, multiple: {order: 'modified'}, continueIf: listAddAuthorsTask },
      authors: { table: db.membership, multiple: {} },
      member: { continueIf: listOnlyIfExistsOrPublicCommunity.bind(null,db.community.model.type.exclusive) },
      viewpoints: { table: db.topicViewpoint, data: [], multiple: {}}
    };

    if (optionalUser !== undefined)  {
      tasks.member.table = db.membership;
      tasks.member.parameters = { userId: optionalUser.id, communityId: communityUnmaskedId };
    } else {
      tasks.member.data = undefined;
    }

    chain.load(tasks, ['community','member','topics','viewpoints'], listOnDataLoaded.bind(null,db,callback),callback);
  }

  function listOnlyIfExistsOrPublicCommunity (communityTypeExclusive, repository, tasks) {
    if (repository.member) {
      tasks.viewpoints.parameters = { memberId : repository.member.id };
      delete tasks.viewpoints.data;
      return true;
    }
    return (repository.community.type !== communityTypeExclusive) ? true : Errors.noPermissions('topics') ;
  }

  function listAddAuthorsTask (repository, tasks) {
    repository.topics.reverse(); // changing to descending order
    var topicCount = repository.topics.length;
    var topicIdList = [];
    var authors = {}; // we need to find distinct authors!
    while (topicCount--) {
      var topic = repository.topics[topicCount];
      topicIdList[topicIdList.length] = topic.id;
      authors[topic.authorId] = true;
    }
    if (repository.member && topicIdList.length > 0) { // if member, add topicIds to viewpoints task
      tasks[0].parameters.topicId = topicIdList;
    }
    authors = Object.keys(authors);

    if (authors.length > 0) {
      tasks.authors.parameters.id = authors;
    } else {
      tasks.authors.data = [];
      delete tasks.authors.table;
    }
    return true;
  }

  function listOnDataLoaded (db,callback, data) {
    callback({
      topics: db.topic.model.toList(data.topics),
      viewpoints : db.topicViewpoint.model.toMap(data.viewpoints, 'topicId'),
      authors : db.membership.model.toMap(data.authors,'id','toMinJSON'),
      communities : db.community.model.toMap(data.communities,'id','toMinJSON')
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, communityId, topicId, topic, db, callback) {
    if (communityId !== undefined) {
      topic.communityId = communityId;
    }
    if (topicId !== undefined) {
      topic.id = topicId;
    }

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
    var communityUnmaskedId = Encryption.unmask(topic.communityId);

    chain.load ({
      community: { table:db.community, parameters: communityUnmaskedId, continueIf: chain.onlyIfExists },
      author: { table:db.membership, parameters: { userId: authUser.id, communityId: communityUnmaskedId }, continueIf: authorExistsAndCanSuggest }
    }, ['community','author'], addOnDataLoaded.bind(null, topic, db, callback), callback);
  }

  function authorExistsAndCanSuggest (repository) {
    return (repository.author ? (repository.author.can ('suggest') ? true : Errors.noPermissions('suggest')) : Errors.notFound('member'));
  }

  function addOnDataLoaded (topic, db, callback, data) {
    var sanitizedString = validators.sanitizeString(topic.content);

    if (!data.community.isTopicLengthOk(sanitizedString)) {
      callback(Errors.tooLong('topic'));
      return;
    }

    topic = db.topic.model.getNew(data.author.id, data.community.id, sanitizedString, topic.status ? topic.status : db.topic.model.status.published);
    db.topic.create (topic, chain.onSaved.bind(null, addOnDataSaved.bind(null, callback, data)));
  }

  function addOnDataSaved (callback, data, topicJSON) {
    if (!(topicJSON instanceof Error)) {
      var community = data.community;
      community.topics = data.community.topics + 1;
      community.modified = new Date();
      community.save();
    }
    callback({
      topic: topicJSON,
      author: data.author.toJSON(),
      community: data.community.toJSON()
    });
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, topic, db, callback) {
    chain.load ({
      topic: { table:db.topic, parameters: Encryption.unmask(topic.id), continueIf: setUpdateQueries },
      community: { table:db.community, continueIf: chain.onlyIfExists },
      author: { table:db.membership, parameters: { userId: authUser.id}, continueIf: isPostBelongsToAuthor }
    }, ['topic', 'community','author'], updateOnDataLoaded.bind(null, topic, callback), callback);
  }

  function setUpdateQueries (repository, tasks) {
    var topic = repository.topic;
    if (topic) {
      tasks.community.parameters = topic.communityId;
      tasks.author.parameters.id = topic.authorId;
    }

    return (topic !== null);
  }

  function isPostBelongsToAuthor(repository) {
    return (repository.author ? (repository.author.can ('suggest') ? true : Errors.noPermissions('suggest')) : Errors.notFound('member'));
  }

  function updateOnDataLoaded (jTopic, callback, data) {
    var topic = data.topic;
    jTopic.content = validators.sanitizeString(jTopic.content);
    chain.update(jTopic, topic);

    if (isImmutable(topic)) {
      callback(Errors.immutable('topic'));
      return;
    } else if (!data.community.isTopicLengthOk(topic.content)) {
      callback(Errors.tooLong('topic-content'));
      return;
    }

    topic.modified = new Date();
    topic.save(chain.onSaved.bind(null, updateOnSaved.bind(null, callback, data)));
  }

  function updateOnSaved (callback, data, topicJSON) {
    callback({
      topic: topicJSON,
      author: data.author.toMinJSON(),
      community: data.community.toMinJSON()
    });
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
