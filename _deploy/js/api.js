app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';

    this.api = this.api || {
      backend : (location.href.indexOf('localhost') > -1 ? 'http://localhost:5000/' : 'http://theo-dorus.rhcloud.com/'),
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

    this.api.cached = (function cached (method, url, data, callback) {
        var cache = this.api.cache;
        var key = method + url;
        if (cache[key] && cache[key].modified > ((new Date()).getTime() - this.api.cacheExpiration)) {
            return cache[key].response;
        } else if (method === 'post' || method === 'put') {
            O.AJAX[method](this.api.backend + url, data, this.ifNotError.bind(this,this.api.saveToCache.bind(this, key, callback)));
        } else {
            callback = data;
            console.log('===>'+url);
            O.AJAX[method](this.api.backend + url, this.ifNotError.bind(this,this.api.saveToCache.bind(this, key, callback)));
        }
    }).bind(this);

    this.api.clearCache = (function clearCache() {
        this.api.cache = {};
    }).bind(this);

    this.addCommunity = (function addCommunity (data, callback) {
        this.api.cached('post', 'community/', data, callback);
    }).bind(this);
    this.api.getCommunityList = (function getCommunityList (callback) {
        this.api.cached('get', 'community/', callback);
    }).bind(this);

    this.api.getMyCommunities = (function getMyCommunities (callback) {
        this.api.cached('get', 'membership/', callback);
    }).bind(this);

    this.api.getCommunity = (function getCommunity (communityId, callback) {
        this.api.cached('get', 'community/' + communityId + '/', callback);
    }).bind(this);

    this.api.getCommunityTopics = (function getCommunityTopics (communityId, callback) {
        this.api.cached('get', 'community/' + communityId + '/topics/', callback);
    }).bind(this);


    this.api.joinCommunity = (function joinCommunity (communityId, data ,callback) {
        this.api.cached('post', 'community/'+communityId+'/members/', data, callback);
    }).bind(this);

    this.api.quitCommunity = (function quitCommunity (communityId, callback) {
        this.api.cached('post', 'community/' + communityId + '/quit/', callback);
    }).bind(this);

return this;}).call(app);