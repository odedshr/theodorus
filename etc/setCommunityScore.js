(function setCommunityScoreClosure () {
  'use strict';

  var date = require('../etc/dateScore.js');
  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db/db.js').quickAndDirty;
  var counts = {}, isThoroughMode = true;

  module.exports.run = run;

  function run () {
    isThoroughMode = false;
    db(withDB);
  }

  module.exports.thorough = thorough;

  function thorough () {
    isThoroughMode = true;
    db(withDB);
  }

  function withDB(dbModels) {
    models = dbModels;
    models.topic.count({status: models.topic.model.status.published}, gotTopicCount);
  }

  function gotTopicCount(err, topicCount) {
    counts.topics = topicCount;
    models.user.count({status: models.user.model.status.active}, gotUserCount);
  }

  function gotUserCount(err, userCount) {
    counts.users = userCount;
    models.community.find({ status: models.community.model.status.active }, gotCommunityList );
  }

  function gotCommunityList(err, communities) {
    var counter;
    if (err !== null) {
      console.log (err);
      return;
    }
    counter = { total: communities.length, left: communities.length, updated: 0, errors: 0 };
    for (var i = 0, length = communities.length; i < length; i++) {
      var community = communities[i];
      if (isCalcRequired(community.scoreDate, community.modified)) {
        models.record.find({ communityId: community.id }, gotRecords.bind(null, counter, community) );
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

  function gotRecords (counter, community, err, records) {
    var acc = 0;
    if (err !== null) {
      console.log (err);
      return 0;
    }
    for (var i = 0, length = records.length; i < length; i++) {
      var record = records[i];
      acc += date.getScoreDate( record.created );
    }
    community.score = ((acc/length) + (community.topics/counts.topics) + (community.members/counts.users)) /3;
    community.scoreDate = (new Date());
    community.save(communitySaved.bind(null, counter));
  }

  function communitySaved (counter, err) {
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
      console.log (counter.total + ' communities: ' + counter.updated +' scored, ' + counter.errors + ' errors');
    }
  }
})();