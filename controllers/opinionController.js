;(function opinionControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var chain = require('../helpers/chain.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  function add (authUser, topicId, content, status, db, callback) {
    if (topicId !== undefined) {
      var unmasked = Encryption.unmask(topicId);
      db.topic.get(Encryption.unmask(topicId), chain.onLoad.bind(null,'topic',addOnTopicLoaded.bind(null, authUser, content, status, db, callback),callback,true));
    }else {
      callback(Errors.missingInput('topicId'));
    }

  }

  function addOnTopicLoaded (authUser, content, status, db, callback, topic) {
    chain ([{name:'topic', data: topic },
      {name:'community', table:db.community, parameters: topic.communityId, continueIf: chain.onlyIfExists },
      {name:'author', table:db.membership, parameters: {userId: authUser.id, communityId: topic.communityId }, continueIf: chain.onlyIfExists }
    ], addLoadHistory.bind(null, content, status, db, callback), callback);
  }

  function addLoadHistory (content, status, db, callback, data) {
    if (data.author.can('opinionate')) {
      if (data.community.isOpinionLengthOk(content)) {
        db.opinion.one({authorId: data.author.id, topicId: data.topic.id, status: db.opinion.model.status.published}, chain.onLoad.bind(null,'history',addOnDataLoaded.bind(null, content, status, db, callback, data),callback,false));
      } else {
        callback(Errors.tooLong('opinion'));
      }
    } else {
      callback(Errors.noPermissions('opinionate'));
    }
  }

  function addOnDataLoaded (content, status, db, callback, data, history) {
    data.history = history;
    db.opinion.create(db.opinion.model.getNew(data.author.id, data.community.id, data.topic.id, validators.sanitizeString(content), status ? status :  db.opinion.model.status.published),
      chain.onSaved.bind(null, addOnDataSaved.bind(null, db, callback, data)));
  }

  function addOnDataSaved (db, callback, data, opinionJSON) {
    var now = new Date();
    if (data.history) {
      data.history.status = db.opinion.model.status.history;
      data.history.modified = now;
      data.history.save();

      opinionJSON.history = { id: data.history.id, created: data.history.created };
    } else {
      data.topic.opinions = +data.topic.opinions + (opinionJSON.status === db.opinion.model.status.published);
      data.topic.modified = now;
      data.topic.save();
    }

    opinionJSON.author = data.author.toJSON();
    callback(opinionJSON);
  }

  function archive (authUser, opinionId, db, callback) {
    update( authUser, { id: opinionId, status: db.opinion.model.status.archived }, db, callback );
  }

  function update (authUser, opinion, db, callback) {
    if (opinion && opinion.id) {
      db.opinion.get(Encryption.unmask(opinion.id), chain.onLoad.bind(null,'opinion',updateOnOpinionLoaded.bind(null, authUser, opinion, db, callback),callback,true));
    } else {
      callback(Errors.notFound());
    }
  }
  function updateOnOpinionLoaded (authUser, newOpinion, db, callback, opinion) {
    chain ([{name: 'opinion', data: opinion },
        {name: 'newOpinion', data: newOpinion },
        {name: 'topic', table: db.topic, parameters: opinion.topicId },
        {name:'author', table:db.membership, parameters: opinion.authorId, continueIf: isOpinionBelongsToAuthor.bind(null, authUser.id) },
        {name:'community', table:db.community, parameters: opinion.communityId, continueIf: chain.onlyIfExists }
    ], updateOnCommunityLoaded.bind(null, db, callback), callback);
  }

  function isOpinionBelongsToAuthor(userId, repository) {
    return (repository.author !== undefined) ? (repository.author.userId === userId ? true : Errors.noPermissions('opinionate')) : Errors.notFound('author');
  }

  function updateOnCommunityLoaded (db, callback, data) {
    if (data.opinion.comments === 0 && data.opinion.endorse === 0 && data.opinion.report === 0) {
      var archivedStatus = db.opinion.model.status.archived;
      if (data.newOpinion.content !== undefined) {
        if (data.community.isOpinionLengthOk(data.newOpinion.content)) {
          data.opinion.content = data.newOpinion.content ;
        } else {
          callback(Errors.tooLong('opinion'));
          return;
        }
      }
      if ((data.newOpinion.status === archivedStatus) && (data.opinion.status !== archivedStatus)) {
        data.topic.opinions = +data.topic.opinions - 1; // opinion will be added at addOnDataSaved()
        data.topic.save();
      }
      data.opinion.status = data.newOpinion.status ? data.newOpinion.status : data.opinion.status;
      data.opinion.modified = new Date();
      data.opinion.save(chain.onSaved.bind(null, addOnDataSaved.bind(null, db, callback, data)));
    } else {
      if (data.opinion.status === db.opinion.model.status.published) {
        addOnDataLoaded (data.newOpinion.content, data.newOpinion.status, db, callback, data, data.opinion);
      } else {
        callback(Errors.immutable('opinion'));
      }
    }
  }

  function get (authUser, opinionId, db, callback) {
    db.opinion.get(Encryption.unmask(opinionId), chain.onLoad.bind(null, 'opinion',getOnOpinionLoaded.bind(null, authUser, db, callback), callback, true));
  }

  function getOnOpinionLoaded (authUser, db, callback, opinion) {
    chain ([{name:'opinion', data: opinion},
      {name:'community', table:db.community, parameters: opinion.communityId, continueIf: chain.onlyIfExists},
      {name:'member', table:db.membership, parameters: { userId: authUser.id, communityId: opinion.communityId}},
      {name:'author', table:db.membership, parameters: opinion.authorId},
      {name:'history', table:db.opinion, parameters: { topicId: opinion.topicId, authorId: opinion.authorId, status: db.opinion.model.status.history}, multiple: {order: 'modified'}}
    ], getOnDataLoaded.bind(null, db, callback), callback);
  }

  function getOnDataLoaded (db, callback, data) {
    if (data.member || data.community.type !== db.community.model.type.exclusive) {
      data.opinion.author = data.author;
      data.opinion.community = data.community;
      data.opinion.history = data.history;
      callback(data.opinion.toJSON());
    } else {
      callback (Errors.noPermissions('get-topic'));
    }
  }

  function list (authUser, topicId, db, callback) {
    db.topic.get(Encryption.unmask(topicId), chain.onLoad.bind(null, 'topic', listOnTopicLoaded.bind(null, authUser, db, callback), callback, true));
  }

  function listOnTopicLoaded (authUser, db, callback, topic) {
    chain([{name: 'topic', data: topic},
      { name: 'community', table: db.community, parameters: topic.communityId, continueIf: chain.onlyIfExists},
      { name: 'member', table: db.membership, parameters: { userId: authUser.id, communityId: topic.communityId } }
    ], listOnMemberLoaded.bind(null, db, callback), callback);
  }

  function listOnMemberLoaded (db, callback, data) {
    if (data.member  || data.community.type !== db.community.model.type.exclusive) {
      var query = { topicId: data.topic.id};
      if (data.member) {
        query.or = [ { status: [db.opinion.model.status.published, db.opinion.model.status.history]} ,
          { status: db.opinion.model.status.draft, authorId: data.member.id }];
      } else {
        query.status = [db.opinion.model.status.published, db.opinion.model.status.history];
      }
      db.opinion.find( query, { order: 'created' }, chain.onLoad.bind(null, 'opinions',listOnOpinionsLoaded.bind(null, data, db, callback), callback, true));
    } else {
      callback (Errors.noPermissions('list-comments'));
    }
  }
  function listOnOpinionsLoaded (data, db, callback, opinions) {
    var count = opinions.length, authorIdMap = {};
    if (count > 0) {
      data.opinions = opinions;
      while (count--) {
        authorIdMap[opinions[count].authorId] = true;
      }
      db.membership.find({id: Object.keys(authorIdMap)}, chain.onLoad.bind(null, 'authors',listOnAuthorsLoaded.bind(null, data, db, callback), callback, false));
    } else {
      callback ([]);
    }
  }
  function listOnAuthorsLoaded (data, db, callback, authors) {
    var output = [];
    var postCount = data.opinions.length;
    if (postCount > 0) {
      var historyPerAuthor = {};
      var historyStatus = db.opinion.model.status.history;
      var authorsMap = db.membership.model.toMap(authors);
      var authorsIds = Object.keys(authorsMap);
      while (authorsIds.length) {
        historyPerAuthor[Encryption.unmask(authorsIds.pop())] = [];
      }
      while (postCount--) {
        var opinion = data.opinions[postCount];
        if (opinion.status === historyStatus) {
          historyPerAuthor[opinion.authorId].push(opinion);
        } else {
          opinion.authorJSON = authorsMap[Encryption.mask(opinion.authorId)];
          opinion.history = historyPerAuthor[opinion.authorId];
          output.push(opinion);
        }

      }
    }
    callback(db.opinion.model.toList(output));
  }

  module.exports.add = add;
  module.exports.update = update;
  module.exports.get = get;  // get opinion content
  module.exports.list = list;  // get opinion list of a topic
  module.exports.archive = archive;
})();