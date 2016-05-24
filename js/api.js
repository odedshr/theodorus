(function ApiEnclosure() {
  'use strict';

  this.api = this.api || {
    backend : server,
    cache : {},
    cacheExpiration : 3*1000*60 // 3 minutes;
  };

  this.api.saveToCache = (function saveToCache(key, callback, response) {
    this.api.cache[key] = {
      modified:(new Date()).getTime(),
      response: response
    };
    callback(response);
  }).bind(this);

  function getAjaxOptions(isAnonymous, callback) {
    var token = O.COOKIE('authToken');
    if (token !== undefined) {
      return { credentials: token };
    } if (isAnonymous) {
      return {};
    } else {
      var error = new Error('unauthorized');
      callback(error);
      return error;
    }
  }
  this.api.get = (function get(url, callback, isAnonymous) {
    var options = getAjaxOptions(isAnonymous, callback);
    if (options instanceof Error) {
      return;
    }

    //this.log('api get '+ url, this.logType.debug);
    var cache = this.api.cache;
    if (cache[url] && cache[url].modified >((new Date()).getTime() - this.api.cacheExpiration)) {
      callback(cache[url].response);
    } else {
      O.AJAX.get(this.api.backend + url, this.api.ifNotError.bind(this,this.api.saveToCache.bind(this, url, callback)), options);
    }
  }).bind(this);

  this.api.delete = (function Delete(url, callback, isAnonymous) {
    var options = getAjaxOptions(isAnonymous, callback);
    if (options instanceof Error) {
      return;
    }

    this.api.clearCache();
    O.AJAX.delete(this.api.backend + url, this.api.ifNotError.bind(this,callback), options);
  }).bind(this);

  this.api.post = (function post(url, data, callback, isAnonymous) {
    var options = getAjaxOptions(isAnonymous, callback);
    if (options instanceof Error) {
      return;
    }

    this.api.clearCache();
    O.AJAX.post(this.api.backend + url, data, this.api.ifNotError.bind(this,callback), options);
  }).bind(this);

  this.api.put = (function put(url, data, callback, isAnonymous) {
    var options = getAjaxOptions(isAnonymous, callback);
    if (options instanceof Error) {
      return;
    }

    this.api.clearCache();
    O.AJAX.put(this.api.backend + url, data, this.api.ifNotError.bind(this,callback), options);
  }).bind(this);

  this.api.clearCache = (function clearCache(key) {
    if (key === undefined) {
    this.api.cache = {};
  } else {
    delete this.api.cache[key];
  }

  }).bind(this);
  //==================
  function ErrorHandler(callback, item) {
    if (item instanceof Error) {
      switch(item.status) {
        case 0:   // && item.message instanceof XMLHttpRequestProgressEvent
          O.EVT.dispatch('connection-error', item.message);
          break;
        case 401:// unauthorized
          this.handleUnauthorized();
          break;
        case 404: // not found
          this.renderPage('notFoundPage');
          break;
        default:
          this.log(item, this.logType.debug);
      }
    } else {
      callback(item);
    }
  }
  this.api.ifNotError = ErrorHandler.bind(this);

  //==================
  function whenAsyncTaskIsDone(taskName, tasksCompleted, callback, output, taskResponse) {
    output[taskName] = taskResponse;
    if (--tasksCompleted.counter === 0) {
      callback(output);
    }
  }

  this.api.async = (function async(tasks, callback) {
    var taskNames = Object.keys(tasks);
    var output = {};
    var tasksCompleted = { counter : taskNames.length };

    for(var i = 0, length = taskNames.length; i < length; i++) {
      var taskName = taskNames[i];
      var task = tasks[taskName];
      task(whenAsyncTaskIsDone.bind(this,taskName, tasksCompleted,callback, output));
    }
  }).bind(this);

  //==================
  this.api.ping = (function ping(callback) {
    this.api.get('ping', this.api.ifNotError.bind(this,callback), true);
  }).bind(this);

  //================= Authentication
  this.api.postConnectionToken = (function postConnectionToken(email, subject, content, callback) {
    var data = {
      email: email,
      subject: subject,
      content: content
    };
    this.api.post('user/connect/', data , callback);
  }).bind(this);

  this.api.getAuthToken = (function getAuthToken(connectionToken, callback) {
    this.api.get('user/connect/' + connectionToken, callback);
  }).bind(this);

  this.api.getUser = (function getUser(callback) {
    this.api.get('user/', callback);
  }).bind(this);

  this.api.setUserProfile = (function setUserProfile(user, callback) {
    this.api.post('user/', user, callback);
  }).bind(this);

  //================== Membership
  this.api.getAllUserImages = (function getAllUserImages(callback) {
    this.api.get('membership/all/images', callback);
  }).bind(this);

  this.api.updateProfileImage = (function updateProfileImage(membershipId, data, callback) {
    this.api.put(''.concat('membership/',membershipId,'/image'), data, callback);
  }).bind(this);

  this.api.getProfileImageURL = (function getProfileImageURL(membershipId) {
    return ''.concat(this.api.backend,'membership/',membershipId,'/image');
  }).bind(this);

  this.api.updateMembership = (function updateProfileImage(membershipId, data, callback) {
    this.api.post(''.concat('membership/',membershipId), data, callback);
  }).bind(this);

  this.api.membershipExists = (function membershipExists(data, callback) {
    this.api.post(''.concat('membership/exists'), data, callback);
  }).bind(this);

  function getMemberships(api, communityId, callback) {
    api.get('community/' + communityId + '/membership/', callback, true);
  }
  this.api.getMemberships = getMemberships.bind(this,this.api);

  //================== Communities
  this.api.getTopCommunities = (function getTopCommunities(page,size,callback) {
    this.api.get('community/top/'+size+'/page/'+page, callback, true);
  }).bind(this);

  this.api.addCommunity = (function addCommunity(data, callback) {
    this.api.put('community/', data, callback);
  }).bind(this);

  this.api.getCommunityList = (function getCommunityList(callback) {
    this.api.get('community/', callback, true);
  }).bind(this);

  this.api.getMyMemberships = (function getMyMemberships(callback) {
    this.api.get('membership/', callback);
  }).bind(this);

  this.api.getCommunity = (function getCommunity(communityId, callback) {
    this.api.get('community/' + communityId + '/', callback, true);
  }).bind(this);

  this.api.getCommunityTopics = (function getCommunityTopics(communityId, callback) {
    this.api.get('community/' + communityId + '/topics/', callback, true);
  }).bind(this);

  this.api.joinCommunity = (function joinCommunity(communityId, data ,callback) {
    this.api.put('community/'+communityId+'/membership/', data, callback);
  }).bind(this);

  this.api.quitCommunity = (function quitCommunity(communityId, callback) {
    this.api.clearCache('community/');
    this.api.get('community/' + communityId + '/quit/', callback);
  }).bind(this);

  this.api.communityExists = (function communityExists(community, callback) {
    this.api.post('community/exists', community, callback);
  }).bind(this);

  //================= Tags
  this.api.getTopTags = (function getTopTags(page,size,callback) {
    this.api.get('topic/tag/'+size+'/page/'+page, callback, true);
  }).bind(this);

  //================= Posts - general

  this.api.archive = (function archive(type, id, callback) {
    this.api.delete(''.concat(type,'/',id), callback);
  }).bind(this);

  this.api.getAttachmentURL = (function getProfileImageURL(filename) {
    return ''.concat(this.api.backend,'attachment/',filename);
  }).bind(this);

  //================= Topics
  this.api.getTopTopics = (function getTopTopics(page,size,callback) {
    this.api.get('topic/top/'+size+'/page/'+page, callback, true);
  }).bind(this);

  this.api.getTopicsByTag = (function getTopicsByTag(tags,callback) {
    this.api.get('topic/tag/'+tags.join('+'), callback, true);
  }).bind(this);

  this.api.getCommunityTopics = (function getCommunityTopics(communityId, callback) {
    this.api.get('community/' + communityId + '/topics', callback, true);
  }).bind(this);

  this.api.setTopic = (function addTopic(data, callback) {
    this.api.post('topic/', data, callback);
  }).bind(this);

  //================= Opinions
  function GetTopicOpinions(topicId, callback) {
    this.api.get('topic/' + topicId + '/opinions', callback, true);
  }
  this.api.getTopicOpinions = GetTopicOpinions.bind(this);

  function SetOpinion(data, callback) {
    if (data.opinion.id) {
      this.api.post('opinion/' + data.opinion.id, data, callback);
    } else if (data.opinion.topicId) {
      this.api.put('topic/' + data.opinion.topicId + '/opinions', data, callback);
    } else {
      callback(new Error('missing-details'));
    }
  }
  this.api.setOpinion = SetOpinion.bind(this);

  //================= Comments
  this.api.getPostComments = (function getPostComments(opinionId, parentId, callback) {
    if (parentId) {
      this.api.get('comment/' + parentId + '/comments', callback);
    } else if (opinionId) {
      this.api.get('opinion/' + opinionId + '/comments', callback);
    } else {
      callback(new Error('missing-details'));
    }
  }).bind(this);

  this.api.setComment = (function setComment(data, callback) {
    var comment = data.comment;
    if (comment.id) {
      this.api.post('comment/' + comment.id, data, callback);
    } else if (comment.parentId) {
      this.api.put('comment/' + comment.parentId + '/comments', data, callback);
    } else if (comment.opinionId) {
      this.api.put('opinion/' + comment.opinionId + '/comments', data, callback);
    } else {
      callback(new Error('missing-details'));
    }
  }).bind(this);

  //================= Feedback
  this.api.feedback = (function feedback(data, callback) {
    this.api.put('feedback/' , data, callback, true);
  }).bind(this);

  //================= ViewPoints
  this.api.setAttribute = (function setAttribute(type,id,attribtue, callback) {
    this.api.get(''.concat(type,'/',id,'/',attribtue), callback );
  }).bind(this);

}).call((function (appName) {
  var global = typeof window !== 'undefined' ? window : (module ? module.exports : global);
  if (global[appName] === undefined) { global[appName] = {}; }
  return global[appName];
})('app'));
