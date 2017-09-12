(function maintenanceClosure () {
  'use strict';

  var moment = require('moment');
  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db/db.js');

  var minutesInTwoDays = 60 * 48;
  var hoursInOneWeek = 24 * 7;

  function getScoreDate(dateString, now) {
    var date = moment(new Date(dateString)), diff;
    if (now === undefined) {
      now = moment();
    }
    if ((diff = now.diff(date, 'minutes')) < 60) { // less than an hour (0.75 -1)
      return 1 - ((diff/60)*0.25);
    } else if ((diff = now.diff(date, 'minutes')) < minutesInTwoDays) { // less than 48hr (0.5 - 0.75)
      return 0.5 + (0.25 * diff / minutesInTwoDays);
    } else if ((diff = now.diff(date, 'hours')) < hoursInOneWeek) { // less than a week (0.3 - 0.5)
      return 0.3 + (0.2 * diff / minutesInTwoDays);
    } else if ((diff = now.diff(date, 'days')) < 30) { // less than a month (0.2 - 0.3)
      return 0.2 + (0.1 * diff / 30);
    } else if ((diff = now.diff(date, 'month')) < 6) { // less than 6 months (0.1 - 0.2)
      return 0.1 + (0.1 * diff / 6);
    } else if ((diff = now.diff(date, 'days')) < 365) { // less than a year (0.05 - 0.1)
      return 0.05 + (0.05 * diff / 365);
    } else { // more than one year (0 - 0.05)
      return 0.05 * now.diff(date, 'year');
    }
  }

  function isScoreOutOfDate (scoreDate, modified, now) {
    scoreDate = moment(new Date(scoreDate));
    modified = moment(new Date(modified));
    if (now.diff(modified, 'minutes') < 60) { // less than an hour (0.75 -1)
      return true;
    } else if (now.diff(modified, 'minutes') < minutesInTwoDays) { // less than 48hr (0.5 - 0.75)
      return now.diff(scoreDate, 'minutes') > 60;
    } else if (now.diff(modified, 'hours') < hoursInOneWeek) { // less than a week (0.3 - 0.5)
      return now.diff(scoreDate, 'minutes') > minutesInTwoDays;
    } else if (now.diff(modified, 'days') < 30) { // less than a month (0.2 - 0.3)
      return now.diff(scoreDate, 'hours') > hoursInOneWeek;
    } else if (now.diff(modified, 'month') < 6) { // less than 6 months (0.1 - 0.2)
      return now.diff(scoreDate, 'days') > 30;
    } else if (now.diff(modified, 'days') < 365) { // less than a year (0.05 - 0.1)
      return now.diff(scoreDate, 'month') > 6;
    } else { // more than one year (0 - 0.05)
      return now.diff(scoreDate, 'year') > 1;
    }
  }

  function onCommunitySaved (counter, err) {
    counter.left--;
    if (err !== null) {
      console.log (err);
      counter.errors++;
    } else {
      counter.updated++;
    }
    finishedScoringItem(counter);
  }

  function gotRecords (counter, community, now, err, records) {
    var acc = 0;
    if (err !== null) {
      console.log (err);
      return 0;
    }
    for (var i = 0, length = records.length; i < length; i++) {
      var record = records[i];
      acc += getScoreDate( record.created, now );
    }
    community.scoreDate = (new Date());
    community.save(onCommunitySaved.bind(null, counter));
  }

  function finishedScoringItem (counter) {
    if (counter.left === 0) {
      console.log (counter.total + ' '+counter.type + ': ' + counter.updated +' scored, ' + counter.errors + ' errors');
    }
  }

  function gotItems(type, err, items) {
    var loadParams, now = moment(), counter;
    if (err !== null) {
      console.log (err);
      return;
    }
    counter = { type: type, total: items.length, left: items.length, updated: 0, errors: 0 };
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i], scoreDate = item.scoreDate, modified = item.modified;
      if (scoreDate === undefined || scoreDate < modified || isScoreOutOfDate(scoreDate, modified, now)) {
        loadParams = {};
        loadParams[type+'id'] = item.id;
        models.record.find(loadParams, gotRecords.bind(null, counter, item, now) );
      } else {
        counter.left--;
        finishedScoringItem(counter);
      }
    }
  }

  function run () {
    db.connect(config('dbConnectionString', true),config('guidLength'), function gotModels (dbModels) {
      models = dbModels;
      models.topic.count({ status: models.topic.model.status.published }, function gotTopicCount(err, topicCount) {
        console.log('total of '+ topicCount + ' topics');

        models.community.find({ status: models.community.model.status.active }, gotItems.bind(null,'community') );
        models.topic.find({ status: models.topic.model.status.published }, gotItems.bind(null,'topic') );
      });
    });
  }

  module.exports.run = run;
})();