(function setTopicScoreClosure () {
  'use strict';

  var date = require('../etc/dateScore.js');
  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db.js').quickAndDirty;
  var communityMemberCount = {}, isThoroughMode = true;

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
    models.community.find({ status: models.community.model.status.active }, gotCommunityList );
  }

  function gotCommunityList(err, items) {
    if (err !== null) {
      console.log (err);
      return;
    }
    for (var i = 0, length = items.length; i < length; i++) {
      var item = items[i];
      communityMemberCount[item.id] = item.members;
    }
    models.topic.find({ status: models.topic.model.status.published }, gotTopicList );
  }

  function gotTopicList(err, topics) {
    var counter;
    if (err !== null) {
      console.log (err);
      return;
    }
    counter = { total: topics.length, left: topics.length, updated: 0, errors: 0 };
    for (var i = 0, length = topics.length; i < length; i++) {
      var topic = topics[i];
      if (isCalcRequired(topic.scoreDate, topic.modified)) {
        models.record.find({ topicId: topic.id }, gotRecords.bind(null, counter, topic) );
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

  function gotRecords (counter, topic, err, records) {
    var acc = 0;
    var members = communityMemberCount[topic.communityId];
    if (err !== null) {
      console.log (err);
      return 0;
    }
    for (var i = 0, length = records.length; i < length; i++) {
      var record = records[i];
      acc += date.getScoreDate( record.created );
    }

    topic.score = Math.max(0, ((acc/length) +
                                (topic.follow/members) +
                                (topic.endorse/members) -
                                (topic.endorse/members)) / 3);
    topic.scoreDate = (new Date());
    topic.save(topicSaved.bind(null, counter));
  }

  function topicSaved (counter, err) {
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