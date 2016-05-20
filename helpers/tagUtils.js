(function tagUtilsEnclosure() {
  'use strict';

  var modelUtils = require('../helpers/modelUtils.js');

  function extractTags (string) {
    var tags = string ? string.match(/(^|\W)(#[a-z\d][\w-]*)/ig) : [];
    var output = {};
    var tag;
    for (var i = 0, length = (tags ? tags.length : 0); i < length; i++) {
      tag = tags[i];
      tag = tag.substr(tag.indexOf('#')+1);
      if (output[tag] === undefined) {
        output[tag] = 1;
      } else {
        output[tag]++;
      }
    }
    return output;
  }

  function update (tags, string, memberId, subjectId, tagModel, task) {
    if (tags === undefined) {
      tags = [];
    }
    var newTagMap = extractTags(string);
    var currentTagMap = [];
    var toAdd = [];
    var toRemove = [];
    var newTags, newTag, tag;
    for (var i = 0, length = tags.length; i < length; i ++) {
      tag = tags[i];
      currentTagMap[tag.value] = tag;
      if (newTagMap[tag.value] === undefined) {
        toRemove.push(tag);
      }
    }

    newTags = Object.keys(newTagMap);
    length = newTags.length;
    for (i = 0; i < length; i ++) {
      tag = newTags[i];
      if (currentTagMap[tag] === undefined || currentTagMap[tag].count !== newTagMap[tag]) {
        newTag = tagModel.getNew(tag, memberId, subjectId, newTagMap[tag]);
        toAdd.push(newTag);
        if (currentTagMap[tag] !== undefined) {
          newTag.id = currentTagMap[tag].id;
        }

      }
    }
    task.data = toAdd;
    task.remove = toRemove;
    task.save = (toAdd.length > 0 || toRemove.length > 0);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function getRelevantSubjectIdMap (tags, subjects) {
    var subjectIdMap = modelUtils.toMap(subjects, 'id');
    var map = {};
    for (var i = 0, length = tags.length; i < length; i++) {
      var tag = tags[i];
      var subjectId = tag.subjectId;
      if (subjectIdMap[subjectId] !== undefined) {
        if (map[subjectId] === undefined) {
          map[subjectId] = [ tag.value ];
        } else {
          map[subjectId].push(tag.value);
        }
      }
    }
    return map;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  exports.update = update;
  exports.getRelevantSubjectIdMap = getRelevantSubjectIdMap;
})();