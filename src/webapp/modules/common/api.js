;(function apiEnclosure(scope) {
  'use strict';

  function API () {}
  //API is our container class. We'll add the interface to its prototype
  var backend = '';

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function getAjaxOptions(isAnonymous) {
    var options = {};
    var token = O.COOKIE('authToken');
    if (token !== undefined) {
      options.credentials = token;
    } else if (isAnonymous !== true){
      throw new scope.error.unauthorized();
    }

    return options;
  }

  function get(url, callback, isAnonymous) {
    O.AJAX.get(backend + url,
               handleResponse.bind({}, callback),
               getAjaxOptions(isAnonymous));

    return true;
  }

  function Delete(url, callback, isAnonymous) {
    O.AJAX.delete(backend + url,
                  handleResponse.bind({}, callback),
                  getAjaxOptions(isAnonymous));

    return true;
  }

  function post(url, data, callback, isAnonymous) {
    O.AJAX.post(backend + url,
                data,
                handleResponse.bind({}, callback),
                getAjaxOptions(isAnonymous, callback));

    return true;
  }

  function put(url, data, callback, isAnonymous) {
    O.AJAX.put(backend + url,
               data,
               handleResponse.bind({}, callback),
               getAjaxOptions(isAnonymous, callback));


    return true;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////

  function handleResponse(callback, item) {
    if (item instanceof Error) {
      switch (item.status) {
        case 0:   // && item.message instanceof XMLHttpRequestProgressEvent
          //scope.api.onConnectionError(item.message);
          break;
        case 401:// unauthorized
          //scope.nav.handleUnauthorized();
          break;
        case 404: // not found
          //scope.nav.renderPage('notFoundPage');
          break;
        default:
          //scope.log(item, scope.log.type.debug);
      }
    }
    callback(item);
  }

  //overwrite this function
  function onConnectionError(item) {
    scope.log(item, scope.log.type.debug);
  }

  //////////////////////////////////////////////////////////////////////// async

  function whenAsyncTaskIsDone(taskName, tasksCompleted, callback, output, taskResponse) {
    output[taskName] = taskResponse;
    if (--tasksCompleted.counter === 0) {
      callback(output);
    }
  }

  API.prototype.async = function async(tasks, callback) {
    var taskNames = Object.keys(tasks);
    var output = {};
    var tasksCompleted = { counter: taskNames.length };

    for (var i = 0, length = taskNames.length; i < length; i++) {
      var taskName = taskNames[i];
      var task = tasks[taskName];
      task(whenAsyncTaskIsDone.bind({}, taskName, tasksCompleted, callback, output));
    }
  };

  ///////////////////////////////////////////////////////////////////////// ping

  API.prototype.ping = function ping(callback) {
    get('ping', api.handleResponse.bind({}, callback), true);

    return true;
  };

  /////////////////////////////////////////////////////////////// Authentication

  API.prototype.user = function user(user, callback) {
    if (arguments.length==2) {
      return post('user/', user, callback);
    } else {
      get('user/', arguments[0]);
    }
  };

  API.prototype.user.authenticate = function authenticate(email, subject, content, callback) {
    var data = {
      email: email,
      subject: subject,
      content: content,
    };
    return post('user/connect/', data, callback);
  };


  API.prototype.user.connect = function connect(connectionToken, callback) {
    return get('user/connect/' + connectionToken, callback);
  };

  /////////////////////////////////////////////////////////////////// Membership

  API.prototype.membership = {
    image: {
      get: function getImageURL(membershipId) {
        return backend + 'membership/' + membershipId +'/image';
      },

      list: function getAllUserImages(callback) {
        return get('membership/all/images', callback);
      },

      set: function (membershipId, data, callback) {
        return put('membership/' + membershipId + '/image', data, callback);
      }
    },

    add: function addMembership(communityId, data, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId',communityId);
      }

      return put('community/' + communityId + '/membership/', data, callback);
    },

    end: function endMembership(communityId, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId',communityId);
      }

      return get('community/' + communityId + '/quit/', callback);
    },

    exists: function membershipExists(data, callback) {
      return post('membership/exists', data, callback);
    },

    get: function getMemberships(communityId, callback) {
      return get('community/' + communityId + '/membership/', callback, true);
    },

    list: function getMyMemberships(callback) {
      return get('membership/', callback);
    },

    set: function updateMembership(membershipId, data, callback) {
      return post('membership/' + membershipId, data, callback);
    }
  };

  ////////////////////////////////////////////////////////////////// Communities

  API.prototype.community = {
    add: function addCommunity(data, callback) {
      return put('community/', data, callback);
    },

    exists: function communityExists(community, callback) {
      return post('community/exists', community, callback);
    },

    get: function getCommunity(communityId, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId',communityId);
      }

      return get('community/' + communityId + '/', callback, true);
    },

    list: function listCommunities(callback) {
      return get('community/', callback, true);
    },

    set: function updateCommunity(communityId, data, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId',communityId);
      }

      post('community/' + communityId, data, callback);
    }
  };

  API.prototype.community.list.top = function getTopCommunities(page, size, callback) {
    return get('community/top/' + size + '/page/' + page, callback, true);
  };

  ////////////////////////////////////////////////////////////////// //// Topics

  API.prototype.topic = {
    byTag: function getTopicsByTag(tags, callback) {
      return get('topic/tag/' + tags.join('+'), callback, true);
    },

    list: function getCommunityTopics(communityId, callback) {
      return get('community/' + communityId + '/topics', callback, true);
    },

    set: function setTopic(data, callback) {
      return post('topic/', data, callback);
    },

    setAttribute: setAttribute.bind(this, 'topic'),

    top: function getTopTopics(page, size, callback) {
      return get('topic/top/' + size + '/page/' + page, callback, true);
    }
  };

  ////////////////////////////////////////////////////////////////// // Opinions

  API.prototype.opinion = {
      list: function getTopicOpinions(topicId, callback) {
        return get('topic/' + topicId + '/opinions', callback, true);
      },

      set: function setOpinion(data, callback) {
        if (data.opinion.id) {
          return post('opinion/' + data.opinion.id, data, callback);
        } else if (data.opinion.topicId) {
          return put('topic/' + data.opinion.topicId + '/opinions', data, callback);
        } else {
          callback(new scope.error.missingInput('topicId'));
        }
      },

      setAttribute: setAttribute.bind(this, 'opinion')
  };

  ////////////////////////////////////////////////////////////////// // Comments

  API.prototype.comment = {
    list: function getPostComments(opinionId, parentId, callback) {
      if (parentId) {
        return get('comment/' + parentId + '/comments', callback);
      } else if (opinionId) {
        return get('opinion/' + opinionId + '/comments', callback);
      } else {
        callback(new scope.error.missingInput('opinionId'));
      }
    },

    set: function setComment(data, callback) {
      var comment = data.comment;
      if (comment.id) {
        return post('comment/' + comment.id, data, callback);
      } else if (comment.parentId) {
        return put('comment/' + comment.parentId + '/comments', data, callback);
      } else if (comment.opinionId) {
        return put('opinion/' + comment.opinionId + '/comments', data, callback);
      } else {
        callback(new scope.error.missingInput('opinionId'));
      }
    },

    setAttribute: setAttribute.bind(this, 'comment')
  };

  //////////////////////////////////////////////////////////////////  ViewPoints
  function setAttribute(type, id, attribtue, callback) {
    return get(type + '/' + id + '/' + attribtue, callback);
  }

  ////////////////////////////////////////////////////////////////// ////// Tags

  API.prototype.topic.tag = function getTopTags(page, size, callback) {
    return get('topic/tag/' + size + '/page/' + page, callback, true);
  };

  ////////////////////////////////////////////////////////////////// // Feedback
  API.prototype.feedback = function feedback(data, callback) {
    return put('feedback/', data, callback, true);
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////

  scope.api = new API();

})(theodorus);
