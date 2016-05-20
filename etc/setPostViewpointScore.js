(function setTopicScoreClosure () {
  'use strict';

  var date = require('../etc/dateScore.js');
  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db.js').quickAndDirty;
  var modelUtils = require('../helpers/modelUtils.js');
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
    models.community.find({ status: models.community.model.status.active }, gotCommunityList );
  }

  function gotCommunityList(err, communities) {
    if (err !== null) {
      console.log(err);
      return;
    }
    for (var i = 0, length = communities.length; i < length; i++) {
      var communityId = communities[i].id;
      models.topic.find({ communityId: communityId, status: models.topic.model.status.published },
        gotTopicList.bind(null, communityId) );
    }
  }

  function gotTopicList(communityId, err, topics) {
    var map = {};
    for (var i = 0, length = topics.length; i < length; i++) {
      var topic = topics[i];
      map[topic.id] = topic;
    }
    models.membership.find({ communityId: communityId, status: models.membership.model.status.active },
      gotMembershipList.bind(null, map) );

  }
  function gotMembershipList(topics, err, memberships) {
    if (err !== null) {
      console.log(err);
      return;
    }
    var authors = modelUtils.toMap(memberships,'id');

    for (var i = 0, length = memberships.length; i < length; i++) {
      var membership = memberships[i];
      models.topicViewpoint.find({ memberId: membership.id }, gotViewpoints.bind(null, membership, topics, authors));
      // load all viewpoints => create viewpoints
      // load all topics without viewpoints => if needed, update them
    }
  }

  function gotViewpoints(membership, topics, authors, err, viewpoints) {
    var viewpoint, viewpointByTopicId = [], topicsIds = Object.keys(topics), topicId;
    if (err !== null) {
      console.log(err);
      return;
    }

    for (var i = 0, length = viewpoints.length; i < length ; i++) {
      viewpoint = viewpoints[i];
      topicId = viewpoint.topicId;
      viewpointByTopicId[topicId] = true;
      if (isCalcRequired(viewpoint.scoreDate, viewpoint.modified)) {
        //time * reaction.attributes * author.score
        setViewpointScore(viewpoint, authors[topics[topicId].authorId]);
      }
    }

    length = topicsIds.length;
    for (i = 0; i < length; i++) {
      topicId = topicsIds[i];
      if (!viewpointByTopicId[topicId]) {
        viewpoint = models.topicViewpoint.model.getNew( membership.id, topicId);
        setViewpointScore(viewpoint, authors[topics[topicId].authorId]);
      }
    }
  }

  function isCalcRequired (scoreDate, modified) {
    return scoreDate === undefined ||
      scoreDate < modified ||
      (isThoroughMode && date.isScoreOutOfDate(scoreDate, modified));
  }

  function setViewpointScore(viewpoint, author) {
    viewpoint.score = Math.max( 0, (author +
      (viewpoint.endorse ? 1 : 0) +
      (viewpoint.follow ? 1 : 0) -
      (viewpoint.report ? 1 : 0)) /3 );
    viewpoint.scoreDate = (new Date());
    viewpoint.save();
  }

})();