;(function postControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');
  var chain = require('../helpers/chain.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isImmutable (comment) {
    return comment.comments > 0 || comment.follow > 0 || comment.endorse > 0 > comment.report > 0;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, commentId, db, callback) {
    var unmaskedCommentId = Encryption.unmask (commentId);
    if (isNaN(unmaskedCommentId)) {
      callback(Errors.badInput('commentId',commentId));
      return;
    }
    sergeant ({ comment : { table:db.comment, parameters: unmaskedCommentId, after: archiveUpdateQueries.bind(null, db) },
                author:   { table:db.membership, parameters: { userId : authUser.id}, after: sergeant.onlyIfExists },
                community:{ table:db.community, parameters: {}, after: sergeant.onlyIfExists },
                parent:   { table:db.opinion, after: sergeant.onlyIfExists },
                updateComment:   { before: archiveUpdateComment.bind(null,db), data: {} },
                updateParent:   { before: archiveUpdateParent, data: {} },
                json: { before: archivePrepareForJSON.bind(null, authUser.id, db), json: true}
             },
      ['topic', 'author', 'community','parent', 'json'], callback );
  }

  function archiveUpdateQueries (db, repository, tasks) {
    var comment = repository.comment;
    if (comment) {
      if (isImmutable(comment)) {
        return Errors.immutable('comment');
      }

      tasks.authors.parameters.authorId = comment.authorId;
      tasks.community.parameters = comment.communityId;
      if (comment.opinionId) {
        tasks.parent.table = db.opinion;
        tasks.parent.parameters = comment.opinionId;
      } else if (comment.parentId) {
        tasks.parent.table = db.comment;
        tasks.parent.parameters = comment.parentId;
      } else {
        return Errors.notFound('comment-parent',Encryption.mask(comment.id));
      }
    }
    return (repository.comment !== null);
  }

  function archiveUpdateComment (db, repository) {
    var comment = repository.comment;
    comment.status = db.comment.model.status.archived;
    comment.modified = new Date();
    repository.updateComment = comment;
    return true;
  }

  function archiveUpdateParent (repository) {
    var parent = repository.parent;
    parent.comments--;
    repository.updateParent = parent;
    return true;
  }

  function archivePrepareForJSON (repository) {
    repository.comment = repository.updateComment;
    delete repository.updateComment;
    repository.parent = repository.udpateParent;
    delete repository.parent;
    delete repository.author;
    delete repository.community;
    return true;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, commentId, db, files, callback) {
    var unmaskedCommentId = Encryption.unmask(commentId);
    if (isNaN(unmaskedCommentId)) {
      callback(Errors.badInput('commentId',commentId));
      return;
    }
    var tasks = {
      comment: { table: db.comment, parameters: unmaskedCommentId, continueIf: getUpdateQueries },
      community: { table: db.community, continueIf: sergeant.onlyIfExists },
      author: { table: db.author, continueIf: sergeant.onlyIfExists },
      member: { table: db.membership, data: null },
      viewpoint: {  table: db.commentViewpoint, data: null }
    };
    if (optionalUser) {
      tasks.member.parameters = { userId: optionalUser.id };
      delete tasks.member.data;
    }
    chain.load ( tasks, ['comment','community','author','member','viewpoint'], getOnDataLoaded.bind(null, db ,files, callback));
  }

  function getUpdateQueries (repository, tasks) {
    var comment = repository.comment;
    if (comment === null) {
      return false;
    }
    tasks.community.parameters = comment.communityId;
    tasks.author.parameters = comment.authorId;
    tasks.member.parameters.communityId = comment.communityId;
    tasks.member.continueIf = getAddMemberToViewpointQuery ;
    tasks.viewpoint.parameters = { commentId: comment.id };
    return true;
  }

  function getAddMemberToViewpointQuery (repository, tasks) {
    var member = repository.member;
    if (member === null) {
      return false;
    }
    tasks.viewpoint.parameters.memberId = member.id;
    return true;
  }

  function getOnDataLoaded (db, files, callback, data) {
    if (data.member || data.community.type !== db.community.model.type.exclusive) {
      callback({
        comment: data.comment.toJSON(),
        author: data.author.toMinJSON(),
        hasImage: controllers.profileImage.existsSync (files,data.author.id),
        community: data.community.toMinJSON(),
        viewpoint: data.viewpoint.toJSON()
      });
    } else {
      callback (Errors.noPermissions('get-comment'));
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, opinionId, commentId, db, callback) {
    var tasks = {
      comments : { table: db.comments, parameters: { status: db.comment.model.status.published }, continueIf: listUpdateAuthorsQuery, multiple: { order: 'created' } },
      community : { table: db.community, continueIf: chain.onlyIfExists},
      authors: { table: db.membership, multiple: {}},
      member : { continueIf: listOnlyIfExistsOrPublicCommunity.bind(null,db.community.model.type.exclusive)},
      viewpoints: { table: db.topicViewpoint, data: [], multiple: {}}
    };
    if (commentId) {
      commentId = Encryption.unmask(commentId);
      tasks.root = { table: db.comment, parameters: commentId };
      tasks.comments.parameters.parentId = commentId;
    } else if (opinionId) {
      opinionId = Encryption.unmask(opinionId);
      tasks.root = { table: db.comment, parameters: opinionId};
      tasks.comments.parameters.opinionId = opinionId;
    } else {
      callback(Errors.missingInput('opinionId'));
      return;
    }

    tasks.root.continueIf = listUpdateQueries;
    if (optionalUser !== undefined)  {
      tasks.member.table = db.membership;
      tasks.member.parameters = { userId: optionalUser.id};
    } else {
      tasks.member.data = undefined;
    }

    chain.load(tasks, ['comments','community','member','authors'], listOnDataLoaded.bind(null, db, callback), callback);
  }

  function listUpdateQueries (repository, tasks) {
    var root = repository.root;
    if (root) {
      tasks.community.parameters = root.communityId;
      tasks.member.parameters.communityId = root.communityId;
    }
    return (root !== null);
  }

  function listUpdateAuthorsQuery (repository, tasks) {
    var comments = repository.comments;
    var count = comments.length, authorIdMap = {};
    if (count > 0) {
      while (count--) {
        authorIdMap[comments[count].authorId] = true;
      }
      tasks.authors.parameters = {id: Object.keys(authorIdMap)};
    } else {
      tasks.authors = { data: {} };
    }
  }

  function listOnlyIfExistsOrPublicCommunity (communityTypeExclusive, repository, tasks) {
    if (repository.member) {
      tasks.viewpoints.parameters = { memberId : repository.member.id };
      delete tasks.viewpoints.data;
      return true;
    }
    return (repository.community.type !== communityTypeExclusive) ? true : Errors.noPermissions('topics') ;
  }
  function listOnDataLoaded (db, callback, data) {
    callback({
      comments: db.comment.model.toList(data.comments),
      authors : db.membership.model.toMap(data.authors,'id','toMinJSON')
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, opinionId, parentId, commentId, comment, db, callback) {
    if (opinionId !== undefined) {
      comment.opinionId = Encryption.unmask(opinionId);
    }
    if (parentId !== undefined) {
      comment.commentId = Encryption.unmask(parentId);
    }
    if (commentId !== undefined) {
      comment.id = commentId;
    }

    if (comment.id !== undefined) {
      update (authUser, comment, db, callback);
    } else if (comment.opinionId !== undefined || comment.parentId !== undefined) {
      add (authUser, comment, db, callback);
    } else {
      callback (Errors.missingInput('membership.communityId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (authUser, comment, db, callback) {
    var isCommentOnComment = (comment.parentId !== undefined);
    chain.load ({
      parent: { table: (isCommentOnComment ? db.comment : db.opinion), parameters: isCommentOnComment ? comment.parentId : comment.opinionId, continueIf: addUpdateQueries},
      community : { table:db.community, continueIf: chain.onlyIfExists },
      author : { table:db.membership, parameters: { userId: authUser.id }, continueIf: authorExistsAndCanComment }
    }, ['parent', 'community','author'], addOnDataLoaded.bind(comment, db, callback));
  }

  function addUpdateQueries (repository, tasks) {
    var parent = repository.parent;
    if (parent === null) {
      return false;
    }
    tasks.community.parameters = parent.communityId;
    tasks.author.parameters.communityId = parent.communityId;
    return true;
  }

  function authorExistsAndCanComment (repository) {
    return (repository.author ? (repository.author.can ('comment') ? true : Errors.noPermissions('comment')) : Errors.notFound('member'));
  }

  function addOnDataLoaded (jComment, db, callback, data) {
    var sanitizeContent = validators.sanitizeString(jComment.content);
    if (!data.community.isCommentLengthOk(sanitizeContent)) {
      callback(Errors.tooLong('comment'));
      return;
    }

    var comment = db.comment.model.getNew(data.author.id, data.community.id, jComment.opinionId, jComment.parentId, sanitizeContent, status ? status : db.comment.model.status.published);
    db.comment.create(comment, chain.onSaved.bind(null, addOnDataSaved.bind(null, callback, data)));
  }

  function addOnDataSaved (callback, data, commentJSON) {
    var parent = data.parent;

    if (parent && !(commentJSON instanceof Error)) {
      parent.comments++;
      parent.modified = new Date();
      parent.save();
    }
    callback({
      comment: commentJSON,
      author : data.author.toMinJSON(),
      community : data.community.toMinJSON()
    });
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, comment, db, callback) {
    chain.load({
      comment: { table: db.comment, parameters: Encryption.unmask(comment.id), continueIf: updateUpdateQueries},
      author: { table: db.membership, parameters: { userId: authUser.id }, continueIf: isPostBelongsToAuthor },
      community: { table: db.community, continueIf: chain.onlyIfExists }
    },['comment','newComment','author','community'], updateOnDataLoaded.bind (comment, callback));
  }

  function updateUpdateQueries (repository, tasks) {
    var comment = repository.comment;
    if (comment === null) {
      return false;
    }
    tasks.community.parameters = comment.communityId;
    tasks.author.parameters.id = comment.authorId;
    return true;
  }

  function isPostBelongsToAuthor(repository) {
    return (repository.author ? (repository.author.can ('suggest') ? true : Errors.noPermissions('suggest')) : Errors.notFound('member'));
  }

  function updateOnDataLoaded (jComment, callback, data) {
    if (isImmutable(data.comment)) {
      callback(Errors.immutable('comment'));
      return;
    }

    var sanitizeContent = validators.sanitizeString(jComment.content);
    if (data.community.isCommentLengthOk(sanitizeContent )) {
      data.comment.content = sanitizeContent;
      data.comment.modified = new Date();
      data.comment.save(chain.onSaved.bind(null, addOnDataSaved.bind(null, callback, data)));
    } else {
      callback( Errors.tooLong('comment'));
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
  module.exports.get = get;
  module.exports.list = list;
  module.exports.set = set;


})();
