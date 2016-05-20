(function maintenanceClosure () {
  'use strict';

  var config = require('../helpers/config.js');
  var models, db = require('../helpers/db.js');

  function getTags (callback) {
    models.topicTag.aggregate(['value']).groupBy('value').count('value').get(topicTagsLoaded.bind(null, callback));
  }

  function topicTagsLoaded (callback, err, results) {
    if (err) {
      console.log(err);
      return;
    }
    var tag, tags = {}, length = results.length;
    console.log('loaded ' + length + ' topicTags');
    for (var i = 0; i < length; i++) {
      tag = results[i];
      tags[tag.value] = { id: tag.value, count: tag.count_value };
    }
    callback(tags);
  }

  function gotTags(onFinish, tags) {
    purgeUnusedTags(tags);
    saveNewTags(tags, onFinish);
  }

  function purgeUnusedTags(tags) {
    models.tag.find({ not: { id: Object.keys(tags)}}, gotTagsToPurge);
  }

  function gotTagsToPurge (err, tags) {
    if (err) {
      console.log(err);
      return;
    }
    var i = 0, length = tags.length;
    console.log('loaded ' + length + ' tags to purge');
    for (; i < length; i++) {
      tags[i].remove();
    }
  }

  function saveNewTags(tags, onFinish) {
    var i = 0, keys = Object.keys(tags), length = keys.length, onSavedMeta = { left: length, total: length, callback : onFinish };
    for (; i < length; i++) {
      models.tag.create(tags[keys[i]], onTagSaved.bind(null, onSavedMeta));
    }
  }

  function onTagSaved (onSavedMeta) {
    if (--onSavedMeta.left === 0) {
      onSavedMeta.callback(onSavedMeta.total);
    }
  }

  function onFinish (tagCount) {
    console.log('finished writing ' + tagCount + ' tags');
  }

  function run () {
    db.connect(config('dbConnectionString', true),config('guidLength'), function gotModels (dbModels) {
      models = dbModels;

      getTags(gotTags.bind(null, onFinish));
    });
  }

  module.exports.run = run;
})();