;(function topicControllerEnclosure() {
  'use strict';

  var Encryption = require ('../helpers/Encryption.js');
  var tryCatch = require('../helpers/tryCatch.js');
  var sergeant = require('../helpers/sergeant.js');
  var validators = require('../helpers/validators.js');
  var Errors = require('../helpers/Errors.js');

  function set (authUser, subjectType, subjectId, attribute, value, db, callback) {
    sergeant ({
      originalSubject: {
        table: db[subjectType],
        load: subjectId,
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove
      },
      member: {
        table: db.membership,
        before: setPrepareMemberQuery,
        load: { userId: authUser.id },
        after: sergeant.stopIfNotFound,
        finally: sergeant.remove
      },
      viewpoint: {
        table: db[subjectType + 'Viewpoint'],
        before: setPrepareViewpointQuery.bind({}, subjectId),
        beforeSave : setPrepareViewpoint.bind({}, subjectType, attribute, value, db),
        save: true,
        finally: sergeant.json
      },
      subject: {
        table: db[subjectType],
        beforeSave : setPrepareSubject.bind({}, attribute, value),
        save: true,
        finally: sergeant.json
      }
    }, 'originalSubject,member,viewpoint,subject', callback);
  }

  function setPrepareMemberQuery (data, tasks) {
    tasks.member.load.communityId = data.originalSubject.communityId;
  }

  function setPrepareViewpointQuery (subjectId, data, tasks) {
    tasks.viewpoint.load = { memberId: data.member.id, subjectId: subjectId };
  }

  function setPrepareViewpoint (subjectType, attribute, value, db, data, tasks) {
    var viewpoint = data.viewpoint;
    if (viewpoint === null) {
      viewpoint = db[subjectType + 'Viewpoint'].model.getNew( data.member.id, data.originalSubject.id);
    } else if ( viewpoint[attribute] === value) {
      tasks.viewpoint.save = false;
      tasks.subject.save = false;
    }
    viewpoint[attribute] = value;
    tasks.viewpoint.data = viewpoint;
  }

  function setPrepareSubject (attribute, value, data, tasks) {
    var subject = data.originalSubject;
    subject[attribute] += (value ? 1 : -1);
    tasks.subject.data = subject;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function read(authUser, subjectType, subjectId, db, callback) {
    set(authUser, subjectType, subjectId, 'read', true,  db, callback);
  }

  function unread(authUser, subjectType, subjectId, db, callback) {
    set(authUser, subjectType, subjectId, 'unread', false, db, callback);
  }

  function follow(authUser, subjectType, subjectId, db, callback) {
    set(authUser, subjectType, subjectId, 'follow', true, db, callback);
  }

  function unfollow(authUser, subjectType, subjectId, db, callback) {
    set(authUser, subjectType, subjectId, 'follow', false, db, callback);
  }

  function endorse(authUser, subjectType, subjectId, db, callback) {
    set(authUser, subjectType, subjectId, 'endorse', true, db, callback);
  }

  function unendorse(authUser, subjectType, subjectId, db, callback) {
    set(authUser,  subjectType, subjectId, 'endorse', false, db, callback);
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
