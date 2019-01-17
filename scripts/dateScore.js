(function dateScoreClosure () {
  'use strict';

  var moment = require('moment');
  var now = moment();

  var minutesInTwoDays = 60 * 48;
  var hoursInOneWeek = 24 * 7;

  function getScoreDate(dateString) {
    var date = moment(new Date(dateString)), diff;
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

  function isScoreOutOfDate (scoreDate, modified) {
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

  module.exports.getScoreDate = getScoreDate;
  module.exports.isScoreOutOfDate = isScoreOutOfDate;
})();