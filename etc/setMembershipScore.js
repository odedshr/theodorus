(function setTopicScoreClosure () {
  'use strict';

  var date = require('../etc/dateScore.js');
  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db.js').quickAndDirty;
  var isThoroughMode = true;

  module.exports.run = run;

  function run () {
    isThoroughMode = true;
    db(withDB);
  }

  module.exports.thorough = thorough;

  function thorough () {
    isThoroughMode = false;
    db(withDB);
  }

  function withDB(dbModels) {
    models = dbModels;
    models.membership.find({ status: models.membership.model.status.active }, gotMembershipList );
  }

  function gotMembershipList(err, memberships) {
    var counter;
    if (err !== null) {
      console.log (err);
      return;
    }
    counter = { total: memberships.length, left: memberships.length, updated: 0, errors: 0 };
    for (var i = 0, length = memberships.length; i < length; i++) {
      var membership = memberships[i];
      if (isCalcRequired(membership.scoreDate, membership.modified)) {
        models.record.find({ or: [{ memberId: membership.id }, { authorId: membership.id }]},
          gotRecords.bind(null, counter, membership));
      } else {
        counter.left--;
        onSuccess(counter);
      }
    }
  }

  function isCalcRequired (scoreDate, modified) {
    return scoreDate === undefined ||
      scoreDate < modified ||
      (isThoroughMode && date.isScoreOutOfDate(scoreDate, modified));
  }

  function gotRecords (counter, member, err, records) {
    var memCount = 0, memAcc = 0, autCount = 0, autAcc = 0,
        repCount = 0, repAcc = 0, recordTypeReport = models.record.model.type.report,
        memberId = member.id;
    if (err !== null) {
      console.log (err);
      return 0;
    }
    for (var i = 0, length = records.length; i < length; i++) {
      var record = records[i], score = date.getScoreDate( record.created );
      if (record.authorId === memberId) {
        autCount++;
        autAcc += score;
      } else if (record.type === recordTypeReport) {
        repCount++;
        repAcc += score;
      } else {
        memCount++;
        memAcc += score;
      }
    }

    member.score = Math.max(0,((memAcc/memCount) + (autAcc/autCount) - (repAcc/repCount) ) / 2);
    member.scoreDate = (new Date());
    member.save(memberSaved.bind(null, counter));
  }

  function memberSaved (counter, err) {
    counter.left--;
    if (err !== null) {
      console.log (err);
      counter.errors++;
    } else {
      counter.updated++;
    }
    onSuccess(counter);
  }

  function onSuccess (counter) {
    if (counter.left === 0) {
      console.log (counter.total + ' topics: ' + counter.updated +' scored, ' + counter.errors + ' errors');
    }
  }
})();