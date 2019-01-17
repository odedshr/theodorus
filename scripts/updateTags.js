//cSpell:words guid
(function maintenanceClosure() {
  'use strict';

  var config = require('../helpers/config.js'),
      models,
      db = require('../helpers/db/db.js');

  function getTags(callback) {
    models.topicTag.aggregate(['value']).groupBy('value').count('value').get(topicTagsLoaded.bind(null, callback));
  }

  function topicTagsLoaded(callback, err, results) {
    var tags = {};

    if (err) {
      console.log(err);

      return;
    }

    console.log('loaded ' + length + ' topicTags');
    results.forEach(function perResult(tag) {
      tags[tag.value] = { id: tag.value, count: tag.count_value };
    });

    callback(tags);
  }

  function gotTags(onFinish, tags) {
    purgeUnusedTags(tags);
    saveNewTags(tags, onFinish);
  }

  function purgeUnusedTags(tags) {
    models.tag.find({ not: { id: Object.keys(tags) } }, gotTagsToPurge);
  }

  function gotTagsToPurge(err, tags) {
    if (err) {
      console.log(err);

      return;
    }

    console.log('loaded ' + tags.length + ' tags to purge');
    tags.forEach(function purgeTag(tag) {
      tag.remove();
    });
  }

  function saveNewTags(tags, onFinish) {
    var onSavedMeta = { left: length, total: length, callback: onFinish };

    Object.keys(tags).forEach(function saveTag(tag) {
      models.tag.create(tags[tag], onTagSaved.bind(null, onSavedMeta));
    });
  }

  function onTagSaved(onSavedMeta) {
    if (--onSavedMeta.left === 0) {
      onSavedMeta.callback(onSavedMeta.total);
    }
  }

  function onFinish(tagCount) {
    console.log('finished writing ' + tagCount + ' tags');
  }

  function run() {
    db.connect(config('dbConnectionString', true),
              config('guidLength'),
              function gotModels(dbModels) {
                models = dbModels;

                getTags(gotTags.bind(null, onFinish));
              });
  }

  module.exports.run = run;
})();
