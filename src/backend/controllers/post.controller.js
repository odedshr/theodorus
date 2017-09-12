;(function postControllerEnclosure() {
  'use strict';

  var sergeant = require('../helpers/sergeant.js'),
      Errors = require('../helpers/Errors.js'),
      modelUtils = require('../helpers/modelUtils.js'),
      tagUtils = require('../helpers/tagUtils.js'),
      Records = require('../helpers/RecordManager.js'),
      controllers = {};

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function isImmutable(post) {
    return post.replies > 0 || post.follow > 0 || post.endorse > 0 || post.report > 0;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function archive(authUser, postId, db, callback) {
    sergeant({
      existing: { table: db.post,
                  load: postId,
                  after: sergeant.and(sergeant.stopIfNotFound, stopIfImmutable),
                  finally: sergeant.remove },
      author: { table: db.membership,
                before: archiveGetAuthorFromPost,
                load: { userId: authUser.id },
                after: sergeant.stopIfNotFound,
                finally: sergeant.remove },
      community: { table: db.community,
                  before: archiveGetCommunityFromPost,
                  beforeSave: sergeant.and(sergeant.stopIfNotFound, archiveUpdateCommunityPosts),
                  finally: sergeant.minimalJson },
      post: { table: db.community,
              beforeSave: archivePrepare.bind(null, db),
              save: true,
              finally: sergeant.json },
      record: Records.getNewTask(db, db.record.model.type.archive)
    }, 'existing,author,community,post,record', callback);
  }

  function stopIfImmutable(data) {
    if (isImmutable(data.existing)) {
      return Errors.immutable('post');
    }
  }

  function archiveGetAuthorFromPost(data, tasks) {
    tasks.author.load.id = data.existing.authorId;
  }

  function archiveGetCommunityFromPost(data, tasks) {
    // load the community to verify it's existing
    tasks.community.load = data.existing.communityId;
    tasks.community.save = (data.existing.parentId === undefined);
  }

  function archiveUpdateCommunityPosts(data, tasks) {
    if (tasks.community.save) {
      data.community.posts--;
    }
  }

  function archivePrepare(db, data, tasks) {
    var post = data.existing;

    post.status = db.post.model.status.archived;
    post.modified = new Date();
    tasks.post.data = post;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function get(optionalUser, postId, db, files, callback) {
    var tasks = {
      post: { table: db.post,
              load: postId,
              after: sergeant.stopIfNotFound,
              finally: sergeant.json },
      community: { table: db.community,
                  before: getCommunityFromPost,
                  after: sergeant.stopIfNotFound,
                  finally: sergeant.remove },
      member: { table: db.membership,
                before: getMemberFromCommunity.bind(null, optionalUser),
                after: getCheckPermissions.bind(null, db),
                finally: sergeant.remove },
      author: { table: db.membership,
                before: getAuthorFromPost,
                after: sergeant.and(sergeant.stopIfNotFound, getCheckAuthorImage.bind(null, files)),
                finally: sergeant.minimalJson },
      review: { table: db.postReview,
                before: getPrepareReview,
                finally: sergeant.minimalJson }
    };

    sergeant(tasks, 'post,community,author,member,review', callback);
  }

  function getCommunityFromPost(data, tasks) {
    tasks.community.load = data.post.communityId;
  }

  function getMemberFromCommunity(optionalUser, data, tasks) {
    if (optionalUser) {
      tasks.member.load = { userId: optionalUser.id, communityId: data.community.id };
    }
  }

  function getAuthorFromPost(data, tasks) {
    tasks.author.load = data.post.authorId;
  }

  function getPrepareReview(data, tasks) {
    if (data.member) {
      tasks.review.load = { subjectId: data.post.id, memberId: data.member.id };
    }
  }

  function getCheckPermissions(db, data) {
    if (!(data.member || data.community.type !== db.community.model.type.exclusive)) {
      return Errors.noPermissions('get-post');
    }
  }

  function getCheckAuthorImage(files, data) {
    data.author.hasImage = controllers.profileImage.existsSync(files, data.author.id);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function list(optionalUser, communityId, parentId, db, callback) {
    var tasks = {
      parentId: { data: parentId },
      parent: { table: db.post,
                load: parentId,
                finally: sergeant.remove },
      community: { table: db.community,
                  load: communityId,
                  after: sergeant.stopIfNotFound,
                  finally: sergeant.jsonMap },
      posts: { table: db.post,
              load: { parentId: parentId,
                      status: db.post.model.status.published },
              multiple: { order: '-modified' },
              finally: sergeant.fullJson },
      authors: { table: db.membership,
                before: prepareAuthorsQuery,
                multiple: {},
                finally: sergeant.jsonMap },
      member: { table: db.membership,
                before: prepareMemberQuery.bind(null, optionalUser),
                after: listOnlyIfHasPermissions.bind(null, db.community.model.type.exclusive),
                finally: sergeant.remove },
      reviews: { table: db.postReview,
                before: listPrepareReviewsQuery,
                multiple: {},
                finally: sergeant.jsonMap.bind(null, 'subjectId') }
    };

    if (communityId !== undefined) {
      tasks.posts.load.communityId = communityId;
    }

    if (tasks.parent.load !== undefined) {
      tasks.parent.after = sergeant.and(sergeant.stopIfNotFound, addCommunityIdFromParent);
    }

    sergeant(tasks, 'parentId,parent,community,posts,authors,member,reviews', callback);
  }

  function addCommunityIdFromParent(data, tasks) {
    tasks.community.load = data.parent.communityId;
  }

  function prepareAuthorsQuery(data, tasks) {
    if (data.posts.length > 0) {
      tasks.authors.load = { id: modelUtils.toVector(data.posts, 'authorId') };
    }
  }

  function prepareMemberQuery(optionalUser, data, tasks) {
    if (optionalUser) {
      tasks.member.load = { userId: optionalUser.id, communityId: data.community.id };
    }
  }

  function listOnlyIfHasPermissions(communityTypeExclusive, data) {
    return (data.member || data.community.type !== communityTypeExclusive) ? true : Errors.noPermissions('list-posts');
  }

  function listPrepareReviewsQuery(data, tasks) {
    if (data.member && data.posts.length > 0) {
      tasks.reviews.load = { memberId: data.member.id, subjectId: modelUtils.toVector(data.posts, 'id') };
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listByTag(optionalUser, tags, db, callback) {
    var tagList = tags.match(/[a-z\d][\w-]*/g),
        tasks = {
      tags: { table: db.postTag,
              load: { value: tagList },
              multiple: {},
              after: sergeant.stopIfNotFound,
              finally: sergeant.json },
      posts: { table: db.post,
              before: listByTagPostQuery,
              load: { status: db.post.model.status.published },
              multiple: { order: '-score' },
              finally: sergeant.fullJson },
      communities: { table: db.community,
                    before: listByTagCommunityQuery,
                    load: { status: db.community.model.status.active },
                    multiple: {},
                    after: sergeant.stopIfNotFound,
                    finally: sergeant.jsonMap },
      authors: { table: db.membership,
                before: prepareAuthorsQuery,
                multiple: {},
                finally: sergeant.jsonMap },
      memberships: { table: db.membership,
                    before: listByTagMembershipQuery.bind(null, optionalUser),
                    after: listByTagFilterPosts.bind(null, db.community.model.type.exclusive),
                    finally: sergeant.remove },
      reviews: { table: db.postReview,
                before: listByTagReviewsQuery,
                multiple: {},
                finally: sergeant.jsonMap.bind(null, 'subjectId') }
    };

    sergeant(tasks, 'tags,posts,communities,authors,memberships,reviews', listByTagOrder.bind(null, callback));
  }

  function listByTagPostQuery(data, tasks) {
    if (data.tags.length > 0) {
      tasks.posts.load.id = modelUtils.toVector(data.tags, 'subjectId');
    }
  }

  function listByTagCommunityQuery(data, tasks) {
    if (data.posts.length > 0) {
      tasks.communities.load.id = modelUtils.toVector(data.posts, 'communityId');
    }
  }

  function listByTagMembershipQuery(optionalUser, data, tasks) {
    var communities = tasks.communities.load.id;

    if (optionalUser && communities.length > 0) {
      tasks.memberships.load = { userId: optionalUser.id,
                                communityId: tasks.communities.load.id };
    }
  }

  function listByTagFilterPosts(communityTypeExclusive, data) {
    var posts = data.posts,
    keep = [],
    community,
    communityMap = modelUtils.toMap(data.communities),
    membershipMap = modelUtils.toMap(data.memberships, 'communityId');

    posts.forEach(function perPost(post) {
      community = communityMap[post.communityId];

      if (community !== undefined && (community.type !== communityTypeExclusive || membershipMap[community.id])) {
        keep.push(post);
      }
    });

    data.posts = keep;
  }

  function listByTagReviewsQuery(data, tasks) {
    var memberships = data.memberships;

    if (memberships && memberships.length > 0) {
      if (data.posts.length > 0) {
        tasks.reviews.load = { memberId: modelUtils.toVector(memberships, 'id'),
                              subjectId: modelUtils.toVector(data.posts, 'id') };
      }
    }
  }

  function comparePostsByTag(tags, a, b) {
    var tagCount = tags[a.id].length - tags[b.id].length;

    return tagCount ? tagCount : ((a.modified < b.modified) ? -1 : 1);
  }

  function listByTagOrder(callback, data) {
    if (data.tags) {
      data.tags = tagUtils.getRelevantSubjectIdMap(data.tags, data.posts);
      data.posts.sort(comparePostsByTag.bind(null, data.tags));
    }

    callback(data);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listTags(count, page, db, callback) {
    var tasks = {
      tags: { table: db.tag,
              load: {},
              multiple: getMultipleParameters(count, page, 'id'),
              finally: listTagsPrepareMap }
    };

    sergeant(tasks, 'tags', callback);
  }

  function listTagsPrepareMap(data) {
    var map = {};

    data.tags.forEach(function perTag(tag) {
      map[tag.id] = tag.count;
    });

    data.tags = map;
  }

  function getMultipleParameters(limit, offset, order) {
    var map = { order: order };

    limit = +limit;
    offset = +offset;

    if (limit > 0) {
      map.limit = limit;

      if (offset > 0) {
        map.offset = (offset - 1) * limit;
      }
    }

    return map;
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function listTop(optionalUser, count, page, db, callback) {
    var tasks = {
      posts: { table: db.post, load: { status: db.post.model.status.published },
        multiple: getMultipleParameters(count, page, '-score'), finally: sergeant.fullJson },
      communities: { table: db.community, before: listByTagCommunityQuery,
        load: { status: db.community.model.status.active }, multiple: {},
        after: sergeant.stopIfNotFound, finally: sergeant.jsonMap },
      authors: { table: db.membership, before: prepareAuthorsQuery, multiple: {},
        finally: sergeant.jsonMap },
      memberships: { table: db.membership, before: listByTagMembershipQuery.bind(null, optionalUser),
        after: listByTagFilterPosts.bind(null, db.community.model.type.exclusive), finally: sergeant.remove },
      reviews: { table: db.postReview, before: listByTagReviewsQuery, multiple: {},
        finally: sergeant.jsonMap.bind(null, 'subjectId') }
    };

    sergeant(tasks, 'posts,communities,authors,memberships,reviews', callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function setControllers(controllerMap) {
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
  module.exports.set = require('./post.set.controller.js').set;
})();
