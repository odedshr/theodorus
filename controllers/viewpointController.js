;(function topicControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var chain = require('../helpers/chain.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  function getViewpointDBObjectName (subjectType) {
    switch (subjectType) {
      case 'topic': return 'topicViewpoint';
      case 'opinion': return 'opinionViewpoint';
      case 'comment': return 'commentViewpoint';
    }
  }
  function updateViewpoint (authUser, subjectType, subjectId, attribute, value, db, callback) {
    chain ([
      {name: subjectType, table: db[subjectType], parameters: subjectId, continueIf: injectCommunityToMemberQuery.bind({},subjectType) },
      {name: 'member', table: db.membership, parameters: {userId: authUser.id }, continueIf: injectMembershipToTopicQuery.bind({},attribute) },
      {name: 'viewpoint', table: db[getViewpointDBObjectName(subjectType)], parameters: { topicId: subjectId } }
    ], updateViewpointOnViewpointLoaded.bind(null, subjectType, subjectId, attribute, value, db, callback), callback);
  }

  function injectCommunityToMemberQuery (subjectType, repository, tasks) {
    if (repository[subjectType] === undefined) {
      return Errors.notFound('topic');
    } else {
      tasks[tasks.length-1].parameters.communityId = repository[subjectType].communityId;
      return true;
    }
  }

  function injectMembershipToTopicQuery (attribute, repository, tasks) {
    if (repository.member === null) {
      return Errors.notFound('member');
    } else {
      tasks[tasks.length-1].parameters.memberId = repository.member.id;
      return repository.member.can (attribute) ? true : Errors.noPermissions(attribute);
    }
  }

  function updateViewpointOnViewpointLoaded (subjectType, subjectId, attribute, value, db, callback, data) {
    var viewpoint = data.viewpoint;
    var attributeCountDelta = 0;
    var onSave = onViewpointSaved.bind({},subjectType, subjectId, attribute, value, callback);
    var updateSubject = updateSubjectAttributeCount.bind({}, data[subjectType], attribute, onSave );

    if (viewpoint === null || (viewpoint instanceof Error)) {
      attributeCountDelta = 1;
      var viewpointDBObject = getViewpointDBObjectName(subjectType);

      viewpoint = db[viewpointDBObject].model.getNew(data.member.id, subjectId);
      viewpoint[attribute] = value;
      db[viewpointDBObject].create(
          viewpoint,
          chain.onSaved.bind(null, updateSubject.bind({},attributeCountDelta)));
    } else {
      if ( viewpoint[attribute] !== value) {
        attributeCountDelta = value ? 1 : -1;
        viewpoint[attribute] = value;
        viewpoint.save(chain.onSaved.bind(null,updateSubject.bind({},attributeCountDelta) ));
      } else {
        updateSubject(attributeCountDelta);
      }
    }
  }

  function updateSubjectAttributeCount (subject, attribute, onSave, delta) {
    if (delta !== 0) {
      subject[attribute] += delta;
      subject.save(chain.onSaved.bind(null,onSave.bind({},subject[attribute]) ));
    } else {
      onSave(subject[attribute]);
    }
  }
  function onViewpointSaved (subjectType, subjectId, attribute, value, callback, count) {
    var data = {
      subjectType: subjectType,
      subjectId: subjectId,
      attribute : attribute,
      value : value,
      count : count
    };
    callback(data);
  }

  function read (authUser, subjectType, subjectId, db, callback) {
    updateViewpoint(authUser, subjectType, subjectId, 'read', true,  db, callback);
  }

  function unread (authUser, subjectType, subjectId, db, callback) {
    updateViewpoint(authUser, subjectType, subjectId, 'unread', false, db, callback);
  }

  function follow (authUser, subjectType, subjectId, db, callback) {
    updateViewpoint(authUser, subjectType, subjectId, 'follow', true, db, callback);
  }

  function unfollow (authUser, subjectType, subjectId, db, callback) {
    updateViewpoint(authUser, subjectType, subjectId, 'follow', false, db, callback);
  }

  function endorse (authUser, subjectType, subjectId, db, callback) {
    updateViewpoint(authUser, subjectType, subjectId, 'endorse', true, db, callback);
  }

  function unendorse (authUser, subjectType, subjectId, db, callback) {
    updateViewpoint(authUser,  subjectType, subjectId, 'endorse', false, db, callback);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var controllers = {};
  function setControllers (controllerMap) {
    controllers = controllerMap;
  }
  module.exports.setControllers = setControllers;

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports.read = read;
  module.exports.unread = unread;
  module.exports.endorse = endorse;
  module.exports.unendorse = unendorse;
  module.exports.follow = follow;
  module.exports.unfollow = unfollow;
  module.exports.report = function () {};
})();
