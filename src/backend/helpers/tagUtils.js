(function tagUtilsEnclosure() {
  'use strict';

  var modelUtils = require('../helpers/modelUtils.js');

  function extractTags(string) {
    var tags = string ? string.match(/(^|\W)(#[a-z\d][\w-]*)/ig) : [],
        output = {};

    (tags || []).forEach(function perTag(tag) {
      tag = tag.substr(tag.indexOf('#') + 1);

      if (output[tag] === undefined) {
        output[tag] = 1;
      } else {
        output[tag]++;
      }
    });

    return output;
  }

  function update(tags, string, memberId, subjectId, tagModel, task) {
    var newTagMap = extractTags(string),
        currentTagMap = [],
        toAdd = [],
        toRemove = [];

    if (tags === undefined) {
      tags = [];
    }

    tags.forEach(function perTag(tag) {
      currentTagMap[tag.value] = tag;

      if (newTagMap[tag.value] === undefined) {
        toRemove.push(tag);
      }
    });

    Object.keys(newTagMap).forEach(function perTag(tag) {
      var newTag;

      if (currentTagMap[tag] === undefined || currentTagMap[tag].count !== newTagMap[tag]) {
        newTag = tagModel.getNew(tag, memberId, subjectId, newTagMap[tag]);

        toAdd.push(newTag);

        if (currentTagMap[tag] !== undefined) {
          newTag.id = currentTagMap[tag].id;
        }

      }
    });

    task.data = toAdd;
    task.remove = toRemove;
    task.save = (toAdd.length > 0 || toRemove.length > 0);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function getRelevantSubjectIdMap(tags, subjects) {
    var subjectIdMap = modelUtils.toMap(subjects, 'id'),
        map = {};

    tags.forEach(function perTag(tag) {
      var subjectId = tag.subjectId;

      if (subjectIdMap[subjectId] !== undefined) {
        if (map[subjectId] === undefined) {
          map[subjectId] = [tag.value];
        } else {
          map[subjectId].push(tag.value);
        }
      }
    });

    return map;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  exports.update = update;
  exports.getRelevantSubjectIdMap = getRelevantSubjectIdMap;
})();
