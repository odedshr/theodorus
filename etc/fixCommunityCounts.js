(function setCommunityScoreClosure () {
  'use strict';

  var date = require('../etc/dateScore.js');
  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db.js').quickAndDirty;
  var counts = {};

  module.exports.run = run;
  if (require.main === module) {
    run();
  }

  function run () {
    db(withDB);
  }


  function withDB(dbModels) {
    models = dbModels;
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
      models.topic.count({  status: models.topic.model.status.published,
                            communityId: community.id }, gotTopicCount.bind({}, counter, community));
    }
  }

  //
  function gotTopicCount(counter, community, err, count) {
    if (err !== null) {
      console.log (err);
      counter.errors++;
    } else  if (community.topics !== count) {
      community.topics = count;
      community.save();
    }

    models.membership.count({  status: models.membership.model.status.active,
      communityId: community.id }, gotMembershipCount.bind({}, counter, community));
  }

  function gotMembershipCount(counter, community, err, count) {
    if (err !== null) {
      console.log (err);
      counter.errors++;
    } else if (community.members !== count) {
      community.members = count;
      community.save();
    }

    counter.left--;
    onSuccess(counter);
  }

  function onSuccess (counter) {
    if (counter.left === 0) {
      console.log (counter.total + ' communities: ' + counter.updated +' scored, ' + counter.errors + ' errors');
    }
  }
})();