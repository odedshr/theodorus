app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';

    this.api = this.api || {
      backend : server,
      cache : {},
      cacheExpiration : 3*1000*60 // 3 minutes;
    };

    this.api.saveToCache = (function saveToCache (key, callback, response) {
        this.api.cache[key] = {
            modified: (new Date()).getTime(),
            response: response
        };
        callback(response);
    }).bind(this);

    function getAjaxOptions (isAnonymous, callback) {
        var token = O.COOKIE('authToken');
        if (token !== undefined) {
            return { credentials: token }
        } if (isAnonymous) {
            return {};
        } else {
            var error = new Error('unauthorized');
            callback(error);
            return error;
        }
    }
    this.api.get = (function get (url, callback, isAnonymous) {
        var options = getAjaxOptions(isAnonymous, callback);
        if (options instanceof Error) {
            return;
        }

        this.log('api get '+ url, this.logType.debug);
        var cache = this.api.cache;
        if (cache[url] && cache[url].modified > ((new Date()).getTime() - this.api.cacheExpiration)) {
            callback (cache[url].response);
        } else {
            O.AJAX.get(this.api.backend + url, this.api.ifNotError.bind(this,this.api.saveToCache.bind(this, url, callback)), options);
        }
    }).bind(this);

    this.api.delete = (function Delete (url, callback, isAnonymous) {
        var options = getAjaxOptions(isAnonymous, callback);
        if (options instanceof Error) {
            return;
        }

        this.log('api delete '+ url, this.logType.debug);

        this.api.clearCache();
        O.AJAX.delete(this.api.backend + url, this.api.ifNotError.bind(this,callback), options);
    }).bind(this);

    this.api.post = (function post (url, data, callback, isAnonymous) {
        var options = getAjaxOptions(isAnonymous, callback);
        if (options instanceof Error) {
            return;
        }

        this.log('api post '+ url + '\n' + JSON.stringify(data), this.logType.debug);

        this.api.clearCache();
        O.AJAX.post(this.api.backend + url, data, this.api.ifNotError.bind(this,callback), options);
    }).bind(this);

    this.api.put = (function put (url, data, callback, isAnonymous) {
        var options = getAjaxOptions(isAnonymous, callback);
        if (options instanceof Error) {
            return;
        }

        this.log('api put '+ url + '\n' + JSON.stringify(data), this.logType.debug);

        this.api.clearCache();
        O.AJAX.put(this.api.backend + url, data, this.api.ifNotError.bind(this,callback), options);
    }).bind(this);

    this.api.clearCache = (function clearCache() {
        this.api.cache = {};
    }).bind(this);
    //==================
    this.api.ifNotError = (function ifNotError (callback, item) {
        if (item instanceof Error && item.message instanceof XMLHttpRequestProgressEvent & item.status === 0) {
            O.EVT.dispatch('connection-error', item.message);
        } else {
            callback(item);
        }
    }).bind(this);

    //==================
    function whenAsyncTaskIsDone (taskName, shouldRunCallback, callback, output, taskResponse) {
        output[taskName] = taskResponse;
        if (shouldRunCallback) {
            callback(output);
        }
    }

    this.api.async = (function async (methods, callback) {
        var tasks = methods.slice().reverse();
        var output = {};
        while (tasks.length) {
            var task = tasks.pop();
            var taskName = task.name.split(' ').pop();
            task(whenAsyncTaskIsDone.bind(this,taskName, tasks.length===0,callback, output));
        }
    }).bind(this);

    //==================
    this.api.ping = (function ping (callback) {
        this.api.get ('ping', this.api.ifNotError.bind(this,callback), true);
    }).bind(this);

    //==================
    var authenticate = (function authenticate (action, email, password, callback) {
        this.api.post (action, {
            email: email,
            password: password
        }, callback, true );
    });

    this.api.signIn = authenticate.bind(this, 'signin');

    this.api.signUp = authenticate.bind(this, 'signup');

    //================= Email
    this.api.getEmail = (function getEmail (callback) {
        this.api.get ('email/', callback);
    }).bind(this);

    //================== Membership
    this.api.updateProfileImage = (function updateProfileImage (membershipId, data, callback) {
        this.api.post (''.concat('membership/',membershipId,'/image'), data, callback);
    }).bind(this);

    this.api.getProfileImageURL = (function getProfileImageURL (membershipId) {
        return ''.concat(this.api.backend,'membership/',membershipId,'/image');
    }).bind(this);

    //================== Communities
    this.api.addCommunity = (function addCommunity (data, callback) {
        this.api.post ('community/', data, callback);
    }).bind(this);

    this.api.getCommunityList = (function getCommunityList (callback) {
        this.api.get ('community/', callback, true);
    }).bind(this);

    this.api.getMyCommunities = (function getMyCommunities (callback) {
        this.api.get ('membership/', callback);
    }).bind(this);

    this.api.getCommunity = (function getCommunity (communityId, callback) {
        this.api.get ('community/' + communityId + '/', callback, true);
    }).bind(this);

    this.api.getCommunityTopics = (function getCommunityTopics (communityId, callback) {
        this.api.get ('community/' + communityId + '/topics/', callback, true);
    }).bind(this);

    this.api.joinCommunity = (function joinCommunity (communityId, data ,callback) {
        this.api.post ('community/'+communityId+'/members/', data, callback);
    }).bind(this);

    this.api.quitCommunity = (function quitCommunity (communityId, callback) {
        this.api.post ('community/' + communityId + '/quit/', {}, callback);
    }).bind(this);

    //================= Posts - general

    this.api.archive = (function archive (type, id, callback) {
        this.api.delete (type + '/' + id, callback);
    }).bind(this);

    //================= Topics
    this.api.getCommunityTopics = (function getCommunityTopics (communityId, callback) {
        this.api.get ('community/' + communityId + '/topics/', callback, true);
    }).bind(this);

    this.api.addTopic = (function addTopic (data, callback) {
        this.api.post ('topic/', data, callback);
    }).bind(this);

    //================= Opinions
    function getTopicOpinions (topicId, callback) {
        this.api.get ('topic/' + topicId + '/opinions/', callback, true);
    }
    this.api.getTopicOpinions = getTopicOpinions.bind(this);

    function setOpinion (data, callback) {
        if (data.id) {
            this.api.post ('opinion/' + data.id, { opinion : data }, callback);
        } else if (data.topicId) {
            this.api.post ('topic/' + data.topicId + '/opinion/', data, callback);
        } else {
            callback (new Error ('missing-details'));
        }
    }
    this.api.setOpinion = setOpinion.bind(this);

    //================= Comments
    this.api.getPostComments = (function getPostComments (opinionId, parentId, callback) {
        var parentType = (parentId === null) ? 'opinion' : 'comment';
        if (parentType === 'opinion') {
            parentId = opinionId;
        }
        this.api.get (parentType + '/' + parentId + '/comments/', callback, true);
    }).bind(this);

    this.api.setComment = (function setComment (data, callback) {
        if (data.id) {
            this.api.post ('comment/' + data.id, { comment : data }, callback);
        } else {
            this.api.post ('comment/' , data, callback);
        }
    }).bind(this);

    //================= Feedback
    this.api.feedback = (function feedback (data, callback) {
        this.api.post ('feedback/' , data, callback, true);
    }).bind(this);

return this;}).call(app);