app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';

    this.backend = 'http://127.0.0.1:5000/';
    //this.backend = 'http://theo-dorus.rhcloud.com/';
    this.api = this.api || {};

    this.api.getCommunityList = (function getCommunityList (callback) {
        O.AJAX.get(this.backend + 'community/', this.ifNotError.bind(this,callback));
    }).bind(this);

    this.api.getMyCommunities = (function getMyCommunities (callback) {
        O.AJAX.get(this.backend + 'membership/', this.ifNotError.bind(this,callback));
    }).bind(this);

    this.api.getCommunity = (function getCommunity (communityId, callback) {
        O.AJAX.get(this.backend + 'community/' + communityId + '/', this.ifNotError.bind(this,callback));
    }).bind(this);

    this.api.getCommunityTopics = (function getCommunityTopics (communityId, callback) {
        O.AJAX.get(this.backend + 'community/' + communityId + '/topics/', this.ifNotError.bind(this,callback));
    }).bind(this);


return this;}).call(app);