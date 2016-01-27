app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.communityTopicList = (function registerCreateCommunityForm (dElm, callback) {
        var communityId = this.mapArgumentsFromLocationHash().community;
        this.api.getCommunityTopics (communityId, renderTopicList.bind(this, dElm));
        callback();
    }).bind(this);

    function renderTopicList (dElm, topics) {
        this.render(dElm, { topicListTemplate: { topics: { topic: topics } } });
    }
return this;}).call(app);