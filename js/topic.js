app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};



    this.registry.communityTopicList = (function registerCreateCommunityForm (dElm, callback) {
        loadTopicList.call(this, dElm);
        callback();
    }).bind(this);

    function loadTopicList (dElm) {
        var communityId = this.state.community;
        this.api.getCommunityTopics (communityId, renderTopicList.bind(this, dElm));
    }

    function renderTopicList (dElm, topics) {
        var membershipId = this.state.communityJSON.membership ? this.state.communityJSON.membership.id : false;
        var topicCount = topics.length;
        while (topicCount--) {
            var topic = topics[topicCount];
            topic.time = moment(topic.modified).format("MMM Do YY, h:mma");
            topic.relativeTime = moment(topic.modified).fromNow();
            topic.isArchivable = (membershipId===topic.author.id) && (topic.opinions === 0) && (topic.endorse === 0);
        }
        this.render(dElm, { topicList: { topics: { topic: topics } } });
    }

    this.registry.frmAddTopic = (function registerCreateCommunityForm (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-add-topic',addTopic.bind(this)).getDispatcher('submit-add-topic');
        callback();
    }).bind(this);

    //==========================

    function addTopic () {
        var content = O.ELM.topicContent.value;
        if (this.models.topic.content.validate(content, this.state.communityJSON)) {
            var data = {
                communityId : this.state.community,
                content: content,
                status: 'published'
            };
            this.api.addTopic(data, onTopicAdded.bind(this));
        }
        return false;
    }

    function onTopicAdded () {
        loadTopicList.call(this, O.ELM.communityTopics);
    }

return this;}).call(app);