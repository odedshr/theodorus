// cSpell:words unfollow, unendorse
;(function reviewControllerEnclosure() {
  'use strict';

  var sergeant = require('../helpers/sergeant.js'),

      controllers = {};

  function set(authUser, subjectType, subjectId, attribute, value, db, callback) {
    var tasks = {
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
      review: {
        table: db[subjectType + 'Review'],
        before: setPrepareReviewQuery.bind({}, subjectId),
        beforeSave: setPrepareReview.bind({}, subjectType, attribute, value, db),
        save: true,
        finally: sergeant.json
      },
      subject: {
        table: db[subjectType],
        beforeSave: setPrepareSubject.bind({}, attribute, value),
        save: true,
        finally: sergeant.json
      }
      //record: Records.getNewTask(db, value)
    };
    sergeant(tasks, 'originalSubject,member,review,subject', callback);
  }

  function setPrepareMemberQuery(data, tasks) {
    tasks.member.load.communityId = data.originalSubject.communityId;
  }

  function setPrepareReviewQuery(subjectId, data, tasks) {
    tasks.review.load = { memberId: data.member.id, subjectId: subjectId };
  }

  function setPrepareReview(subjectType, attribute, value, db, data, tasks) {
    var review = data.review;

    if (review === null) {
      review = db[subjectType + 'Review'].model.getNew(data.member.id, data.originalSubject.id);
    } else if (review[attribute] === value) {
      tasks.review.save = false;
      tasks.subject.save = false;
    }

    review[attribute] = value;
    tasks.review.data = review;
  }

  function setPrepareSubject(attribute, value, data, tasks) {
    var subject = data.originalSubject;

    //to prevent from errors attribute values cannot go below zero;
    subject[attribute] = Math.max(0, subject[attribute] + (value ? 1 : -1));

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

  function setControllers(controllerMap) {
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

  module.exports.report = function() {};
})();
