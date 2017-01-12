;(function postControllerEnclosure() {
  'use strict';

  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');
  var modelUtils = require('../helpers/modelUtils.js');
  var Records = require('../helpers/RecordManager.js');

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
      comment:   { table:db.comment, before: archiveUpdateComment.bind(null,db), save: true, finally: sergeant.json },
      record: Records.getNewTask(db, db.record.model.type.archive)
    }, 'current,author,community,parent,comment,record', callback );
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
    if (data.comments.length > 0) {
      tasks.authors.load = { id: modelUtils.toVector(data.comments,'authorId')};
    }
  }

  function listPrepareViewpointsQuery (data, tasks) {
    if (data.member && data.comments.length > 0) {
      tasks.viewpoints.load = { memberId: data.member.id, subjectId: modelUtils.toVector(data.comments,'id')};
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set (authUser, opinionId, rootCommentId, commentId, comment, images, files, db, callback) {
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
      update (authUser, comment, images, files, db, callback);
    } else if (comment.opinionId !== undefined || comment.parentId !== undefined) {
      add (authUser, comment, images, files, db, callback);
    } else {
      callback (Errors.missingInput('membership.opinionId'));
    }
  }

  //-----------------------------------------------------------------------------------------------------------//

  function add (authUser, comment,images, files, db, callback) {
    var tasks = {
      parent: { table: db.opinion, load: comment.opinionId, after: sergeant.stopIfNotFound,
        finally: sergeant.minimalJSON },
      author : { table: db.membership, before: addPrepareAuthorQuery, load: { userId: authUser.id },
        after: sergeant.and(sergeant.stopIfNotFound, stopIfNoPermissions), finally: sergeant.remove },
      community : { table: db.community, before: addPrepareCommunityQuery,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfLengthNoOK.bind(null, comment.content) ),
        finally: sergeant.remove },
      comment : { table: db.comment, data: comment, beforeSave: addPrepareComment.bind(null,images, files), save: true, finally: sergeant.json },
      updateParent: { table: db.opinion, beforeSave: addPrepareParent, save: true, finally: sergeant.remove },
      record: Records.getNewTask(db, db.record.model.type.add)
    };
    if (comment.parentId) {
      tasks.parent.table = db.comment;
      tasks.parent.load = comment.parentId;
    }
    sergeant (tasks, 'parent,author,community,comment,updateParent,record', callback);
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

  function addPrepareComment (images, files,data, tasks) {
    var comment = tasks.comment.data;
    comment.authorId = data.author.id;
    comment.communityId = data.community.id;
    if (data.parent.opinionId) {
      comment.opinionId = data.parent.opinionId;
    }
    controllers.attachment.set(images, files, comment);
  }

  function addPrepareParent (data, tasks) {
    var parent = data.parent;
    parent.comments++;
    parent.modified = new Date();
    tasks.updateParent.data = parent;
  }

  //-----------------------------------------------------------------------------------------------------------//

  function update (authUser, comment,images, files, db, callback) {
    var tasks = {
      current:  { table:db.comment, load: comment.id,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable), finally: sergeant.remove },
      author: { table: db.membership, before: updatePrepareAuthorQuery, load: { userId: authUser.id },
        after: sergeant.and(sergeant.stopIfNotFound, stopIfNoPermissions), finally: sergeant.remove },
      community: { table: db.community, before: updatePrepareCommunityQuery,
        after: sergeant.and(sergeant.stopIfNotFound, stopIfLengthNoOK.bind(null, comment.content)),
        finally: sergeant.remove },
      comment: { table: db.comment, data:comment, before: updatePrepareComment.bind(null,images, files), load: comment.id,
        save: true, finally: sergeant.json },
      record: Records.getNewTask(db, db.record.model.type.edit)
    };
    sergeant( tasks,'current,author,community,comment,record', callback );
  }

  function updatePrepareAuthorQuery (data, tasks) {
    tasks.author.load.id = data.current.authorId;
  }

  function updatePrepareCommunityQuery (data, tasks) {
    tasks.community.load = data.current.communityId;
  }

  function updatePrepareComment (images, files, data, tasks) {
    var comment = data.current;
    sergeant.update (tasks.comment.data, comment);
    controllers.attachment.set(images, files, comment);
    tasks.comment.data = comment;
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
