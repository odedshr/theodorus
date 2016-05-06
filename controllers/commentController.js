;(function postControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isImmutable (comment) {
    return comment.comments > 0 || comment.follow > 0 || comment.endorse > 0 > comment.report > 0;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive (authUser, commentId, db, callback) {
    sergeant ({
      current:  { table:db.comment, load: commentId,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable), finally: sergeant.remove },
      author:   { table:db.membership, before: archivePrepareAuthorQuery,
        load: { userId : authUser.id}, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community:{ table:db.community, before: archivePrepareCommunityQuery,
        after: sergeant.stopIfNotFound, finally: sergeant.remove },
      parent:   { table:db.opinion, before: archivePrepareParentQuery,
        beforeSave: sergeant.and(sergeant.stopIfNotFound, archiveUpdateParent),
        save: true, after: sergeant.stopIfNotFound, finally: sergeant.minimalJson },
      comment:   { table:db.comment, before: archiveUpdateComment.bind(null,db), save: true, finally: sergeant.json }
    }, 'current,author,community,parent,comment', callback );
  }

  function stopIfImmutable (data, tasks) {
    if (isImmutable(data.current)) {
      return Errors.immutable('comment');
    }
  }
  function archivePrepareAuthorQuery(data, tasks) {
    tasks.author.load.id = data.current.authorId;
  }

  function archivePrepareCommunityQuery(data, tasks) {
    tasks.community.load = data.current.communityId;
  }
  function archivePrepareParentQuery (data, tasks) {
    var current = data.current;
    var parentId = current.parentId;
    if (parentId) {
      tasks.parent.table = tasks.current.table; // parent is a comment and not an opinionl
    } else {
      parentId = current.opinionId;
    }
    tasks.parent.load = parentId;
  }

  function archiveUpdateParent (data, tasks) {
    var parent = data.parent;
    parent.comments--;
    tasks.parent.data = parent;
  }

  function archiveUpdateComment (db, data, tasks) {
    var comment = data.current;
    comment.status = db.comment.model.status.archived;
    comment.modified = new Date();
    tasks.comment.data = comment;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get (optionalUser, commentId, db, files, callback) {
    var tasks = {
      comment: { table: db.comment, load: commentId,
        after: sergeant.stopIfNotFound, finally: sergeant.json },
      community: { table: db.community, before: getPrepareCommunityQuery,
        after: sergeant.stopIfNotFound, finally: sergeant.remove },
      author: { table: db.membership, before: getPrepareAuthorQuery,
        after: sergeant.stopIfNotFound, finally: sergeant.remove },
      member: { table: db.membership,
        after: checkPermission.bind(null, 'get-comment', db), finally: sergeant.remove },
      viewpoint: {  table: db.commentViewpoint, before: getPrepareViewpointQuery, finally: sergeant.json }
    };
    if (optionalUser) {
      tasks.member.load = { userId: optionalUser.id };
      tasks.member.before = getPrepareMemberQuery;
    }
    sergeant ( tasks, 'comment,community,author,member,viewpoint', callback);
  }

  function getPrepareCommunityQuery (data, tasks) {
    tasks.community.load = data.comment.communityId;
  }
  function getPrepareAuthorQuery (data, tasks) {
    tasks.author.load = data.comment.authorId;
  }
  function getPrepareMemberQuery (data, tasks) {
    tasks.member.load.communityId = data.comment.communityId;
  }
  function getPrepareViewpointQuery (data, tasks) {
    if (data.member) {
      tasks.viewpoint.load = { memberId: data.member.id, subjectId: data.comment.id };
    }
  }

  function checkPermission(actionName, db, data) {
    if (!(data.member || data.community.type !== db.community.model.type.exclusive)) {
      return Errors.noPermissions(actionName);
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list (optionalUser, opinionId, rootCommentId, db, callback) {
    var tasks = {
      root: { table: db.opinion, load: opinionId, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      community : { table: db.community, before: listPrepareCommunityQuery, after: sergeant.stopIfNotFound, finally: sergeant.remove },
      member: { table: db.membership, after: checkPermission.bind(null, 'list-opinions', db),
        finally: sergeant.remove },
      comments : { table: db.comment, load: { status: db.comment.model.status.published },
        multiple: { order: '-modified' }, finally: sergeant.fullJson },
      authors: { table: db.membership, before: listPrepareAuthorQuery, multiple: {},
        finally: sergeant.jsonMap },
      viewpoints: { table: db.topicViewpoint, before: listPrepareViewpointsQuery, multiple: {}, finally: sergeant.jsonMap.bind (null,'subjectId') }
    };

    if (rootCommentId) {
      tasks.root.table = db.comment;
      tasks.root.load = rootCommentId;
      tasks.comments.load.parentId = rootCommentId;
    } else if (opinionId) {
      tasks.comments.load.opinionId = opinionId;
    } else {
      callback(Errors.missingInput('opinionId'));
      return;
    }

    if (optionalUser !== undefined)  {
      tasks.member.load = { userId: optionalUser.id };
      tasks.member.before = listPrepareMemberQuery;
    }

    sergeant (tasks, 'root,community,member,comments,authors,viewpoints', callback);
  }

  function listPrepareCommunityQuery (data, tasks) {
    tasks.community.load = data.root.communityId;
  }

  function listPrepareMemberQuery (data, tasks) {
    tasks.member.load.communityId = data.root.communityId;
  }

  function listPrepareAuthorQuery (data, tasks) {
    var comments = data.comments;
    var count = comments.length, authorIdMap = {};
    if (count > 0) {
      while (count--) {
        authorIdMap[comments[count].authorId] = true;
      }
      tasks.authors.load = { id: Object.keys(authorIdMap)};
    }
  }

  function listPrepareViewpointsQuery (data, tasks) {
    if (data.member) {
      var items = data.comments;
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

  function set (authUser, opinionId, rootCommentId, commentId, comment, db, callback) {
    if (opinionId !== undefined) {
      comment.opinionId = opinionId;
    }
    if (rootCommentId !== undefined) {
      comment.parentId = rootCommentId;
    }
    if (commentId !== undefined) {
      comment.id = commentId;
    }

    comment.content = validators.sanitizeString(comment.content);
    comment = db.comment.model.getNew(comment);

    if (comment.id !== undefined) {
      update (authUser, comment, db, callback);
    } else if (comment.opinionId !== undefined || comment.parentId !== undefined) {
      add (authUser, comment, db, callback);
    } else {
      callback (Errors.missingInput('membership.opinionId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (authUser, comment, db, callback) {
    var tasks = {
      parent: { table: db.opinion, load: comment.opinionId, after: sergeant.stopIfNotFound,
        finally: sergeant.minimalJSON },
      author : { table: db.membership, before: addPrepareAuthorQuery, load: { userId: authUser.id },
        after: sergeant.and(sergeant.stopIfNotFound, stopIfNoPermissions), finally: sergeant.remove },
      community : { table: db.community, before: addPrepareCommunityQuery,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfLengthNoOK.bind(null, comment.content) ),
        finally: sergeant.remove },
      comment : { table: db.comment, data: comment, beforeSave: addPrepareComment, save: true, finally: sergeant.json },
      updateParent: { table: db.opinion, beforeSave: addPrepareParent, save: true, finally: sergeant.remove }
    };
    if (comment.parentId) {
      tasks.parent.table = db.comment;
      tasks.parent.load = comment.parentId;
    }
    sergeant (tasks, 'parent,author,community,comment,updateParent', callback);
  }

  function addPrepareCommunityQuery (data, tasks) {
    tasks.community.load = data.parent.communityId;
  }

  function addPrepareAuthorQuery (data, tasks) {
    tasks.author.load.communityId = data.parent.communityId;
  }

  function stopIfNoPermissions (data) {
    return data.author.can ('comment') ? true : Errors.noPermissions('comment');
  }

  function stopIfLengthNoOK (string, data) {
    return data.community.isCommentLengthOk(string) ? true : Errors.tooLong('comment', string);
  }

  function addPrepareComment (data, tasks) {
    var comment = tasks.comment.data;
    comment.authorId = data.author.id;
    comment.communityId = data.community.id;
    if (data.parent.opinionId) {
      comment.opinionId = data.parent.opinionId;
    }
  }

  function addPrepareParent (data, tasks) {
    var parent = data.parent;
    parent.comments++;
    parent.modified = new Date();
    tasks.updateParent.data = parent;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, comment, db, callback) {
    var tasks = {
      current:  { table:db.comment, load: comment.id,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable), finally: sergeant.remove },
      author: { table: db.membership, before: updatePrepareAuthorQuery, load: { userId: authUser.id },
        after: sergeant.and(sergeant.stopIfNotFound, stopIfNoPermissions), finally: sergeant.remove },
      community: { table: db.community, before: updatePrepareCommunityQuery,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfLengthNoOK.bind(null, comment.content)),
        finally: sergeant.remove },
      comment: { table: db.comment, data:comment, before: updatePrepareComment, load: comment.id,
        save: true, finally: sergeant.json }
    };
    sergeant( tasks,'current,author,community,comment', callback );
  }

  function updatePrepareAuthorQuery (data, tasks) {
    tasks.author.load.id = data.current.authorId;
  }

  function updatePrepareCommunityQuery (data, tasks) {
    tasks.community.load = data.current.communityId;
  }

  function updatePrepareComment (data, tasks) {
    sergeant.update (tasks.comment.data, data.current);
    tasks.comment.data = data.current;
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
