;(function postSetControllerEnclosure() {
  'use strict';

  var sergeant = require('../helpers/sergeant.js'),
      validations = require('../helpers/validations.js'),
      Errors = require('../helpers/Errors.js'),
      tagUtils = require('../helpers/tagUtils.js'),
      Records = require('../helpers/RecordManager.js'),
      controllers = {};

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function set(authUser, communityId, parentId, postId, post, images, db, files, callback) {
    var tasks = {
      author: {
        table: db.membership,
        after: sergeant.and(sergeant.stopIfNotFound,
                            setCheckPermissions),
        finally: sergeant.minimalJson },
      community: {
        table: db.community,
        after: sergeant.and(sergeant.stopIfNotFound,
                            stopIfBadPostLength.bind(null, post.content)),
        finally: sergeant.minimalJson },
      parent: {
        table: db.post,
        finally: sergeant.remove
      },
      post: {
        table: db.post,
        beforeSave: preparePost.bind(null, post, images, files, db),
        save: true,
        finally: sergeant.json
      },
      tags: {
        table: db.communityTag,
        before: getTags,
        beforeSave: prepareTags.bind(null, db),
        multiple: {},
        finally: sergeant.remove
      },
      updateCommunity: {
        table: db.community,
        finally: sergeant.remove,
        beforeSave: function prepareCommunity(data, tasks) {
          var community = data.community;

          if (data.post.created === data.post.modified) {
            tasks.updateCommunity.data = community;
            tasks.updateCommunity.save = true;
            community.modified = new Date();

            if (data.post.parentId === undefined) {
              community.posts++;
            }
          }
        }
      },
      updateParent: {
        table: db.post,
        finally: sergeant.remove,
        beforeSave: function prepareParent(data, tasks) {
          if (data.parent !== undefined) {
            if (data.post.created === data.post.modified) {
              data.parent.replies++;
            }

            data.parent.modified = new Date();
            tasks.updateParent.data = data.parent;
            tasks.updateParent.save = true;
          }
        },
      }
    };

    post.communityId = communityId || post.communityId;

    post.id = postId || post.id;
    post.parentId = parentId || post.parentId;

    post.content = validations.sanitizeString(post.content);

    tasks.author.load = { userId: authUser.id };

    tasks.record = Records.getNewTask(db, post.id ?
                                          db.record.model.type.update :
                                          db.record.model.type.add);

    if (post.parentId !== undefined) {
      tasks.parent.load = post.parentId;
      tasks.parent.after = sergeant.stopIfNotFound;
    }

    if (post.communityId !== undefined) {
      tasks.author.load.communityId = post.communityId;
      tasks.community.load = post.communityId;
    } else if (tasks.parent.load !== undefined) {
      tasks.parent.after = sergeant.and(sergeant.stopIfNotFound, setCommunityIdBy.bind(null, 'parent'));
    } else {
      // by the time we load community, we might have its id and we might not, check
      tasks.community.before = stopIfNoCommunityId;
    }

    if (post.id !== undefined) {
      tasks.post.load = post.id;
    }

    sergeant(tasks, 'author,parent,community,post,tags,updateParent,updateCommunity,record', callback);
  }

  function setCommunityIdBy(sourceName, data, tasks) {
    tasks.author.load.communityId = data[sourceName].communityId;
    tasks.community.load = data[sourceName].communityId;
  }

  function stopIfNoCommunityId(data, tasks) {
    if (tasks.community.load === undefined) {
      tasks.community.load = data.author.communityId;
    }

    return (tasks.community.load === undefined) ? Errors.missingInput('post.communityId') : true;
  }

  function stopIfBadPostLength(string, data) {
    var community = data.community;

    if (!community.isPostLengthOK(string)) {
      return Errors.tooLong('post.content', string);
    } else if (string.length === 0) {
      return Errors.tooShort('post.content', string);
    }

    return true;
  }

  function preparePost(jPost, images, files, db, data, tasks) {
    var post = data.post;

    if (post) {
      sergeant.update(jPost, post);
      post.modified = new Date();
    } else {
      jPost.authorId = data.author.id;
      jPost.communityId = data.community.id;
      post = db.post.model.getNew(jPost);
    }

    controllers.attachment.set(images, files, post);
    tasks.post.data = post;
  }

  function getTags(data, tasks) {
    tasks.tags.load = { subjectId: data.post.id, memberId: data.author.id };
  }

  function prepareTags(db, data, tasks) {
    tagUtils.update(data.tags,
                    data.post.content,
                    data.author.id,
                    data.post.id,
                    db.postTag.model,
                    tasks.tags);
  }

  //-----------------------------------------------------------------------------------------------------------//

  /*function add(authUser, post, images, db, files, callback) {
    sergeant({
      author: {
        table: db.membership,
        load: { userId: authUser.id, communityId: post.communityId },
        after: sergeant.and(sergeant.stopIfNotFound, setCheckPermissions),
        finally: sergeant.minimalJson },
      community: {
        table: db.community,
        load: post.communityId,
        beforeSave: sergeant.and(sergeant.stopIfNotFound,
                                verifyStrLenAndUpdateCommunity.bind(null, post.content),
                                incCommunityPostCount),
        save: true, finally: sergeant.minimalJson },
      post: {
        table: db.post,
        before: addPreparePost.bind(null, post, images, files, db),
        save: true, finally: sergeant.json },
      tags: { table: db.postTag,
              data: [],
              beforeSave: prepareTags.bind(null, db),
              multiple: {},
              save: true,
              finally: sergeant.remove },
      record: Records.getNewTask(db, db.record.model.type.add)
    }, 'community,author,post,tags,record', callback);
  }*/

  function setCheckPermissions(data) {
    return data.author.can('suggest') ? true : Errors.noPermissions('suggest');
  }

  // function verifyStrLenAndUpdateCommunity(string, data) {
  //   var community = data.community;
  //
  //   community.modified = new Date();
  //
  //   if (!community.isPostLengthOK(string)) {
  //     return Errors.tooLong('post.content', string);
  //   } else if (string.length === 0) {
  //     return Errors.tooShort('post.content', string);
  //   }
  //
  //   return true;
  // }

  /*function incCommunityPostCount(data) {
    data.community.posts++;
  }*/

  /*function addPreparePost(post, images, files, db, data, tasks) {
    post.authorId = data.author.id;
    post.communityId = data.community.id;
    post = db.post.model.getNew(post);
    controllers.attachment.set(images, files, post);
    tasks.post.data = post;
  }*/

  /*function addSubPost(authUser, post, images, db, files, callback) {
    var status = db.opinion.model.status,
        tasks = {
        parent: {
          table: db.topic,
          load: post.topicId,
          after: sergeant.stopIfNotFound,
          finally: sergeant.minimalJson },
        community: {
          table: db.community,
          before: addPrepareCommunityQuery,
          after: sergeant.and(sergeant.stopIfNotFound, addCheckOpinionLength.bind(null, post.content)),
          finally: sergeant.remove },
        author: {
          table: db.membership,
          before: addPrepareAuthorQuery,
          load: { userId: authUser.id },
          after: sergeant.and(sergeant.stopIfNotFound, authorCanOpinion),
          finally: sergeant.remove },
        current: {
          table: db.opinion,
          before: addPrepareCurrentQuery,
          load: { status: status.published },
          beforeSave: addUpdateCurrentOpinion.bind(null, status),
          finally: sergeant.remove },
        post: {
          table: db.opinion, data: post,
          beforeSave: setSubPost.bind(null, images, files),
          save: true,
          finally: sergeant.json },
        updateParent: {
          table: db.topic,
          beforeSave: addUpdateParent,
          finally: sergeant.remove },
        record: Records.getNewTask(db, db.record.model.type.add)
      };

    sergeant(tasks, 'parent,community,author,current,post,updateParent,record', callback);
  }*/

  /*function setSubPost(images, files, data, tasks) {
    var post = tasks.post.data;

    post.communityId = data.community.id;
    post.authorId = data.author.id;
    post.parentId = data.parent ? data.parent.id : data.current.parentId;

    if (data.current) {
      post.images = data.current.images;
    }

    controllers.attachment.set(images, files, post);
  }*/

  //-----------------------------------------------------------------------------------------------------------//

  /*function addPrepareCommunityQuery(data, tasks) {
    tasks.community.load = data.parent.communityId;
  }*/

  // function addPrepareAuthorQuery(data, tasks) {
  //   tasks.author.load.communityId = data.parent.communityId;
  // }

  // function addPrepareCurrentQuery(data, tasks) {
  //   tasks.current.load.postId = data.parent.id;
  // }

  // function authorCanOpinion(data) {
  //   return data.author.can('post') ? true : Errors.noPermissions('post');
  // }

  // function addCheckOpinionLength(string, data) {
  //   return data.community.isOpinionLengthOk(string) ? true : Errors.tooLong('post', string);
  // }

  // function addUpdateCurrentOpinion(status, data, tasks) {
  //   var current = data.current;
  //
  //   if (current) {
  //     current.status = status.history;
  //     tasks.current.data = current;
  //     tasks.current.save = true;
  //   }
  // }

  // function addUpdateParent(data, tasks) {
  //   var parent;
  //
  //   if (!data.current) {
  //     parent = data.parent;
  //
  //     parent.replies++;
  //     parent.modified = new Date();
  //     tasks.updateParent.data = parent;
  //     tasks.updateParent.save = true;
  //   }
  // }

  //-----------------------------------------------------------------------------------------------------------//
  //-----------------------------------------------------------------------------------------------------------//

  // function update(authUser, post, images, db, files, callback) {
  //   sergeant({
  //     existing: {
  //       table: db.post,
  //       load: post.id,
  //       after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable),
  //       finally: sergeant.remove },
  //     author: {
  //       table: db.membership,
  //       before: updatePrepareAuthor,
  //       load: { userId: authUser.id },
  //       after: sergeant.and(sergeant.stopIfNotFound, isPostBelongsToAuthor),
  //       finally: sergeant.minimalJson },
  //     community: {
  //       table: db.community,
  //       before: updatePrepareCommunity,
  //       beforeSave: sergeant.and(sergeant.stopIfNotFound,
  //         verifyStrLenAndUpdateCommunity.bind(null, post.content)),
  //       finally: sergeant.minimalJson },
  //     post: {
  //       table: db.post,
  //       beforeSave: updatePreparePost.bind(null, post, images, files),
  //       save: true,
  //       finally: sergeant.json },
  //     tags: {
  //       table: db.communityTag,
  //       before: updateGetTags,
  //       beforeSave: prepareTags.bind(null, db),
  //       multiple: {},
  //       save: true,
  //       finally: sergeant.remove },
  //     record: Records.getNewTask(db, db.record.model.type.archive)
  //   }, 'existing,author,community,post,tags,record', callback);
  // }

  // function updatePrepareCommunity(data, tasks) {
  //   tasks.community.load = data.existing.communityId;
  // }

  // function updatePrepareAuthor(data, tasks) {
  //   tasks.author.load = data.existing.authorId;
  // }

  // function isPostBelongsToAuthor(data) {
  //   return data.author.can('suggest') ? true : Errors.noPermissions('suggest');
  // }

  // function updateGetTags(data, tasks) {
  //   tasks.tags.load = { subjectId: data.post.id, memberId: data.author.id };
  // }

  // function stopIfImmutable(data) {
  //   if (isImmutable(data.existing)) {
  //     return Errors.immutable('post');
  //   }
  // }

  // function isImmutable(post) {
  //   return post.opinions > 0 || post.follow > 0 || post.endorse > 0 > post.report > 0;
  // }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function setControllers(controllerMap) {
    controllers = controllerMap;
  }

  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.set = set;
})();
