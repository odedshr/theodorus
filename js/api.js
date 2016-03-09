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

    this.api.ajax = (function ajax (method, url, data, callback) {
        var key = method +'-'+ url;
        this.log('api '+ key, this.logType.debug);
        if (method === 'get') {
            var cache = this.api.cache;
            callback = data;
            if (method === 'get' && cache[key] && cache[key].modified > ((new Date()).getTime() - this.api.cacheExpiration)) {
                callback (cache[key].response);
            } else {
                O.AJAX.get(this.api.backend + url, this.api.ifNotError.bind(this,this.api.saveToCache.bind(this, key, callback)));
            }
        } else {
            this.api.clearCache();
            if (method === 'post' || method === 'put') {
                O.AJAX[method](this.api.backend + url, data, this.api.ifNotError.bind(this,callback));
            } else { //delete
                callback = data;
                O.AJAX[method](this.api.backend + url, this.api.ifNotError.bind(this,this.api.saveToCache.bind(this, key, callback)));
            }
        }
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
        O.AJAX.get(this.api.backend + 'ping', this.api.ifNotError.bind(this,callback));
    }).bind(this);

    //==================
    var authenticate = (function authenticate (action, email, password, callback) {
        this.api.ajax('post', action, {
            email: email,
            password: password
        }, callback );
    });

    this.api.signIn = authenticate.bind(this, 'signin');

    this.api.signUp = authenticate.bind(this, 'signup');

    //================= Topics
    this.api.getEmail = (function getEmail (callback) {
        this.api.ajax('get', 'email/', callback);
    }).bind(this);

    //================== Communities
    this.api.addCommunity = (function addCommunity (data, callback) {
        this.api.ajax('post', 'community/', data, callback);
    }).bind(this);
    this.api.getCommunityList = (function getCommunityList (callback) {
        this.api.ajax('get', 'community/', callback);
    }).bind(this);

    this.api.getMyCommunities = (function getMyCommunities (callback) {
        this.api.ajax('get', 'membership/', callback);
    }).bind(this);

    this.api.getCommunity = (function getCommunity (communityId, callback) {
        this.api.ajax('get', 'community/' + communityId + '/', callback);
    }).bind(this);

    this.api.getCommunityTopics = (function getCommunityTopics (communityId, callback) {
        this.api.ajax('get', 'community/' + communityId + '/topics/', callback);
    }).bind(this);


    this.api.joinCommunity = (function joinCommunity (communityId, data ,callback) {
        this.api.ajax('post', 'community/'+communityId+'/members/', data, callback);
    }).bind(this);

    this.api.quitCommunity = (function quitCommunity (communityId, callback) {
        this.api.ajax('post', 'community/' + communityId + '/quit/', {}, callback);
    }).bind(this);

    //================= Posts - general

    this.api.archive = (function archive (type, id, callback) {
        this.api.ajax('delete', type + '/' + id, callback);
    }).bind(this);

    //================= Topics
    this.api.getCommunityTopics = (function getCommunityTopics (communityId, callback) {
        this.api.ajax('get', 'community/' + communityId + '/topics/', callback);
    }).bind(this);

    this.api.addTopic = (function addTopic (data, callback) {
        this.api.ajax('post', 'topic/', data, callback);
    }).bind(this);

    //================= Opinions
    this.api.getTopicOpinions = (function getTopicOpinions (topicId, callback) {
        this.api.ajax('get', 'topic/' + topicId + '/opinions/', callback);
    }).bind(this);

    this.api.setOpinion = (function setOpinion (data, callback) {
        if (data.id) {
            this.api.ajax('post', 'opinion/' + data.id, data, callback);
        } else if (data.topicId) {
            this.api.ajax('post', 'topic/' + data.topicId + '/opinion/', data, callback);
        } else {
            callback (new Error ('missing-details'));
        }
    }).bind(this);

    //================= Comments
    this.api.getPostComments = (function getPostComments (opinionId, parentId, callback) {
        var parentType = (parentId === undefined) ? 'opinion' : 'comment';
        if (parentType === 'opinion') {
            parentId = opinionId;
        }
        this.api.ajax('get', parentType + '/' + parentId + '/comments/', callback);
    }).bind(this);

    this.api.setComment = (function setComment (data, callback) {
        if (data.id) {
            this.api.ajax('post', 'comment/' + data.id, data, callback);
        } else {
            this.api.ajax('post', 'comment/' , data, callback);
        }
    }).bind(this);

    //================= Feedback
    this.api.feedback = (function feedback (data, callback) {
        this.api.ajax('post', 'feedback/' , data, callback);
    }).bind(this);

return this;}).call(app);