;(function opinionControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var chain = require('../helpers/chain.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, opinionId, db, callback) {
    var unmaskedOpinionId = Encryption.unmask (opinionId);
    if (isNaN(unmaskedOpinionId)) {
      callback(Errors.badInput('opinionId',opinionId));
      return;
    }
    chain.load ({ opinion : { table:db.opinion, parameters: unmaskedOpinionId, continueIf: archiveUpdateQueries.bind(null, db) },
        author: { table: db.membership, parameters: { userId : authUser.id}, continueIf: chain.onlyIfExists },
        community: { table: db.community, parameters: {}, continueIf: chain.onlyIfExists },
        topic: { table: db.topic, continueIf: chain.onlyIfExists }},
      ['topic', 'author', 'community','parent'], archiveOnDataLoaded.bind(null, authUser.id, db, callback), callback);
  }

  function archiveUpdateQueries (db, repository, tasks) {
    var opinion = repository.opinion;
    if (opinion) {
      tasks.authors.parameters.authorId = opinion.authorId;
      tasks.community.parameters = opinion.communityId;
      tasks.topic.parameters = opinion.topicId;
    }
    return (repository.opinion !== null);
  }

  function archiveOnDataLoaded (db, callback, data) {
    var opinion = data.opinion;

    opinion.status = db.comment.model.status.archived;
    opinion.modified = new Date();
    opinion.save(chain.andThenPass('opinion',callback));

    var topic = data.topic;
    topic.opinions--;
    topic.save();
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, opinionId, db, files, callback) {
    var unmaskedOpinionId = Encryption.unmask(opinionId);
    if (isNaN(unmaskedOpinionId)) {
      callback(Errors.badInput('opinionId',opinionId));
      return;
    }

    var tasks = {
      opinion: { table: db.opinion, parameters: unmaskedOpinionId, continueIf: getAddOpinionToQueries },
      community: { table: db.community, continueIf: chain.onlyIfExists },
      history: { table:db.opinion, parameters: { id: unmaskedOpinionId, status: db.opinion.model.status.history}, multiple: {order: 'modified'}},
      author: { table: db.author, continueIf: chain.onlyIfExists },
      member: { table: db.membership, data: null },
      viewpoint: {  table: db.opinionViewpoint, data: null }
    };
    if (optionalUser) {
      tasks.member.parameters = { userId: optionalUser.id };
      delete tasks.member.data;
    }
    chain.load ( tasks, ['opinion','community','history','author','member','viewpoint'], getOnDataLoaded.bind(null, db ,files, callback));
  }

  function getAddOpinionToQueries (repository, tasks) {
    var opinion = repository.opinion;
    if (opinion === null) {
      return false;
    }
    tasks.community.parameters = opinion.communityId;
    tasks.author.parameters = opinion.authorId;
    tasks.member.parameters.communityId = opinion.communityId;
    tasks.member.continueIf = addMemberToViewpointQuery ;
    tasks.viewpoint.parameters = { opinionId: opinion.id };
    return true;
  }

  function addMemberToViewpointQuery (repository, tasks) {
    var member = repository.member;
    if (member !== null) {
      tasks.viewpoint.parameters.memberId = member.id;
    }
    return true;
  }

  function getOnDataLoaded (db, callback, data) {
    if (data.member || data.community.type !== db.community.model.type.exclusive) {
      callback({
        opinion: data.opinion.toJSON(),
        author : data.author.toMinJSON(),
        community : data.community.toMinJSON(),
        history : db.opinion.model.toList(data.history,'toMinJSON')
      });
    } else {
      callback (Errors.noPermissions('get-topic'));
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, topicId, db, callback) {
    var unmaskedTopicId = Encryption.unmask(topicId);
    var status= db.opinion.model.status;
    if (isNaN(unmaskedTopicId)) {
      callback(Errors.badInput('topicId',topicId));
      return;
    }

    var tasks = {topic: { table: db.topic, parameters: unmaskedTopicId, continueIf: listOnTopicLoaded },
      community: { table: db.community, continueIf: chain.onlyIfExists },
      member: { table: db.membership  },
      opinions: { table: db.opinion, parameters: { topicId: unmaskedTopicId, status: [status.published, status.history] }, multiple: { order: 'modified' }, continueIf: listOnOpinionsLoaded},
      authors: { table: db.membership },
      viewpoints: { table: db.opinionViewpoints, multiple: {} }
    };

    if (optionalUser !== undefined)  {
      tasks.member.table = db.membership;
      tasks.member.parameters = { userId: optionalUser.id };
      tasks.member.continueIf = listOnMemberLoaded.bind(null, status);
      tasks.viewpoints.parameters = { userId: optionalUser.id };
    } else {
      tasks.member.data = null;
      tasks.viewpoints.data = [];
    }
    chain.load (tasks,[ 'topic','community','member','opinions','viewpoints'], listOnDataLoaded.bind(null, status, db, callback), callback);
  }

  function listOnTopicLoaded (repository, tasks) {
    var topic = repository.topic;
    if (topic === null ) {
      return false;
    }
    tasks.community.parameters = topic.communityId;
    tasks.member.parameters.communityId = topic.communityId;

    return true;
  }


  function listOnMemberLoaded (status, repository, tasks) {
    var member = repository.member;
    if (member !== null) {
      tasks.opinions.parameters.or =[ tasks.opinions.parameters.status, { status: status.draft, authorId: member.id }];
      delete tasks.opinions.parameters.status;
      tasks.viewpoints.parameters.memberId = member.id;
    }

    return true;
  }

  function listOnOpinionsLoaded (repository, tasks) {
    var opinions = repository.opinions;
    var count = opinions.length, authorIdMap = {};
    if (count > 0) {
      while (count--) {
        authorIdMap[opinions[count].authorId] = true;
      }
      tasks.authors.parameters = { id : Object.keys(authorIdMap) };
    }

    return true;
  }

  function listOnDataLoaded (status, db, callback, data) {
    var output = {
      authors: db.member.model.toMap(data.authors,'id','toMinJSON'),
      communities: db.community.model.toMap(data.authors,'id','toMinJSON'),
      viewpoints: db.member.model.toMap(data.authors,'opinionId','toMinJSON')
    };
    var drafts = [];
    var historyMap = {};
    var published = [];
    var opinions = db.opinion.model.toList(data.opinions);
    var count = opinions.length;
    while (count--) {
      var opinion = opinions[count];
      switch (opinion.status) {
        case status.published:
          published[published.length] = opinion;
          break;
        case status.history:
          if (historyMap[opinion.id] === undefined) {
            historyMap[opinion.id] = [];
          }
          historyMap[opinion.id].push(opinion);
          break;
        case status.draft:
          drafts[drafts.length] = opinion;
          break;
      }
    }
    output.draft = drafts;
    output.history = historyMap;
    output.opinions = published;

    callback(output);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, topicId, opinionId, opinion, db, callback) {
    if (topicId !== undefined) {
      opinion.topicId = topicId;
    }
    if (opinionId !== undefined) {
      opinion.id = opinionId;
    }

    if (opinion.id !== undefined) {
      update (authUser, opinion, db, callback);
    } else if (opinion.topicId !== undefined) {
      add (authUser, opinion, db, callback);
    } else {
      callback (Errors.missingInput('membership.topicId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (authUser, opinion, db, callback) {
    chain.load ({
      topic : { table:db.topic, parameters: Encryption.unmask(opinion.topicId), continueIf: addUpdateQueries },
      community : { table:db.community, continueIf: chain.onlyIfExists },
      author : { table:db.membership, parameters: { userId: authUser.id }, continueIf: authorExistsAndCanOpinion },
      existing: { table: db.opinion, parameters: {}, continueIf: addCreateOpinion.bind(opinion, db) },
      history: { table: db.opinion, data: [] }
    }, ['topic', 'community','author','existing', 'history'], addOnDataLoaded.bind(db, callback));
  }

  function addUpdateQueries (repository, tasks) {
    var topic = repository.topic;
    if (topic === null) {
      return false;
    }
    tasks.community.parameters = topic.communityId;
    tasks.author.parameters.communityId = topic.communityId;
    tasks.existing.parameters.topicId = topic.id;
    return true;
  }

  function authorExistsAndCanOpinion (repository, tasks) {
    var author = repository.author;
    if (author) {
      tasks.existing.parameters.authosId = author.id;
    }
    return (author ? (author.can ('opinionate') ? true : Errors.noPermissions('opinionate')) : Errors.notFound('member'));
  }

  function addCreateOpinion (jOpinion, db, data) {
    var callback = chain.DelayedReturn();
    var sanitizeContent = validators.sanitizeString(jOpinion.content);
    if (!data.community.isOpinionLengthOk(sanitizeContent)) {
      return Errors.tooLong('opinion');
    }

    var opinion = db.opinion.model.getNew(data.author.id, data.community.id, data.topic.id, sanitizeContent, jOpinion.status ? jOpinion.status :  db.opinion.model.status.published);
    db.opinion.create(opinion, addOnDataSaved.bind(null, data, db, callback.input, data));

    return callback.output;
  }

  function addOnDataSaved (data, db, callback, err, opinion) {
    var topic = data.topic;
    var existing = data.existing;
    data.opinion = opinion;

    if (err) {
     callback(new Error(err));

    } else if (existing) {
      existing.status = db.opinion.model.status.history;
      existing.modified = new Date();
      existing.save(callback.bind(null,true));

    } else if (topic && !err) {
      topic.opinions++;
      topic.modified = new Date();
      topic.save(callback.bind(null,true));
    }
  }

  function addOnDataLoaded (db, callback, data) {
    callback({
      opinion: data.opinion.ToJSON(),
      author : data.author.toMinJSON(),
      community : data.community.toMinJSON(),
      history: db.opinion.model.toList(data.history)
    });
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, opinion, db, callback) {
    chain.load ({
      existing: { table:db.opinion, parameters: Encryption.unmask(opinion.id), continueIf: setUpdateQueries.bind(null, db) },
      community: { table:db.community, continueIf: chain.onlyIfExists },
      author: { table:db.membership, parameters: { userId: authUser.id}, continueIf: authorExistsAndCanOpinion },
      history: { table: db.opinion, data: [] }
    }, ['existing', 'community','author'], addOnDataLoaded.bind(opinion, db, callback), callback);
  }

  function setUpdateQueries (db, repository, tasks) {
    var opinion = repository.opinion;
    if (opinion) {
      tasks.community.parameters = opinion.communityId;
      tasks.author.parameters.id = opinion.authorId;
      tasks.history.parameters = { communityId: opinion.communityId, authorId: opinion.authorId, status: db.opinion.model.status.history };
      delete tasks.history.data;
    }

    return (opinion !== null);
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