/* global appName */
;(function apiEnclosure(scope) {
  'use strict';
  var backEnd = '/api/';

  //Api is our container class. We'll add the interface to its prototype
  function Api() {}

  //////////////////////////////////////////////////////////////////////////////////////////////////

  function getAjaxOptions(isAnonymous) {
    var options = {},
        token = scope.cookie('authToken');

    if (token !== undefined) {
      options.credentials = token;
    } else if (isAnonymous !== true) {
      throw new scope.error.unauthorized();
    }

    return options;
  }

  function get(url, callback, isAnonymous) {
    scope.ajax.get(backEnd + url,
      handleResponse.bind({}, callback),
      getAjaxOptions(isAnonymous));

    return true;
  }

  // 'delete' is a reserved word so use 'remove' instead
  function remove(url, callback, isAnonymous) {
    scope.ajax.delete(backEnd + url,
      handleResponse.bind({}, callback),
      getAjaxOptions(isAnonymous));

    return true;
  }

  function post(url, data, callback, isAnonymous) {
    scope.ajax.post(backEnd + url,
      data,
      handleResponse.bind({}, callback),
      getAjaxOptions(isAnonymous, callback));

    return true;
  }

  function put(url, data, callback, isAnonymous) {
    scope.ajax.put(backEnd + url,
      data,
      handleResponse.bind({}, callback),
      getAjaxOptions(isAnonymous, callback));

    return true;
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////

  function handleResponse(callback, item) {
    if (item instanceof Error) {
      switch (item.status) {
        case 0: // && item.message instanceof XMLHttpRequestProgressEvent
          onConnectionError(item.message);
          break;
        case 401: // unauthorized
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

  Api.prototype.async = function async(tasks, callback) {
    var taskNames = Object.keys(tasks),
        output = {},
        tasksCompleted = { counter: taskNames.length };

    taskNames.forEach(function perTaskName(taskName) {
      var task = tasks[taskName];

      task(whenAsyncTaskIsDone.bind({}, taskName, tasksCompleted, callback, output));
    });
  };

  ///////////////////////////////////////////////////////////////////////// ping

  Api.prototype.ping = function ping(callback) {
    get('ping', handleResponse.bind({}, callback), true);

    return true;
  };

  /////////////////////////////////////////////////////////////// Authentication

  Api.prototype.user = function user(user, callback) {
    if (arguments.length === 2) {
      return post('user/', user, callback);
    } else {
      get('user/', arguments[0]);
    }
  };

  Api.prototype.user.authenticate = function authenticate(email, subject, content, callback) {
    var data = {
      email: email,
      subject: subject,
      content: content,
    };

    return post('user/connect/', data, callback);
  };

  Api.prototype.user.connect = function connect(connectionToken, callback) {
    return get('user/connect/' + connectionToken, callback);
  };

  /////////////////////////////////////////////////////////////////// Membership

  Api.prototype.membership = {
    image: {
      get: function getImageURL(membershipId) {
        return backEnd + 'membership/' + membershipId + '/image';
      },

      list: function getAllUserImages(callback) {
        return get('membership/all/images', callback);
      },

      set: function(membershipId, data, callback) {
        return put('membership/' + membershipId + '/image', data, callback);
      }
    },

    add: function addMembership(communityId, data, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId', communityId);
      }

      return put('community/' + communityId + '/membership/', data, callback);
    },

    end: function endMembership(communityId, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId', communityId);
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

  Api.prototype.community = {
    add: function addCommunity(data, callback) {
      return put('community/', data, callback);
    },

    exists: function communityExists(community, callback) {
      return post('community/exists', community, callback);
    },

    get: function getCommunity(communityId, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId', communityId);
      }

      return get('community/' + communityId + '/', callback, true);
    },

    list: function listCommunities(callback) {
      return get('community/', callback, true);
    },

    set: function updateCommunity(communityId, data, callback) {
      if (!scope.validate.id(communityId)) {
        throw scope.error.badInput('communityId', communityId);
      }

      post('community/' + communityId, data, callback);
    }
  };

  Api.prototype.community.list.top = function getTopCommunities(page, size, callback) {
    return get('community/top/' + size + '/page/' + page, callback, true);
  };

  ////////////////////////////////////////////////////////////////// //// Topics

  Api.prototype.post = {
    archive: function archivePost(postId, callback) {
      return remove('post/' + postId, callback, true);
    },

    byTag: function getPostByTag(tags, callback) {
      return get('post/tag/' + tags.join('+'), callback, true);
    },

    list: function getCommunityPosts(communityId, callback) {
      return get('community/' + communityId + '/posts', callback, true);
    },

    listComments: function getCommunityPosts(postId, callback) {
      return get('post/' + postId + '/posts', callback, true);
    },

    listTopTags: function getTopTags(page, size, callback) {
      return get('post/tag/' + size + '/page/' + page, callback, true);
    },

    set: function setPost(data, callback) {
      var post = data.post;

      if (post.id) { // editing existing post or sub-post
        return post('post/' + post.id, data, callback);
      } else if (post.parentId) { // adding a new sub-post
        return put('post/' + post.parentId + '/posts', data, callback);
      } else if (post.communityId)  { //adding a new post
        return put('community/' + post.communityId + '/posts', data, callback);
      } else { //don't know what you're trying to self
        callback(new scope.error.missingInput('post.id', post));
      }
    },

    setAttribute: function setAttribute(id, attribute, callback) {
      return get('post/' + id + '/' + attribute, callback);
    },

    top: function getTopPosts(page, size, callback) {
      return get('post/top/' + size + '/page/' + page, callback, true);
    }
  };

  ////////////////////////////////////////////////////////////////// // Feedback
  Api.prototype.feedback = function feedback(data, callback) {
    return put('feedback/', data, callback, true);
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////

  scope.api = new Api();

})(window[appName] || module.exports);
