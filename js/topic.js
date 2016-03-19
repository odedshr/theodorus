app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.topicList = { preprocess : (function loadTopicList (dElm, callback) {
        var communityId = this.state.community;
        this.api.getCommunityTopics (communityId, topicListOnLoaded.bind(this, callback));
    }).bind(this) };

    function topicListOnLoaded ( callback, topics) {
        var membershipId = this.state.communityJSON.membership ? this.state.communityJSON.membership.id : false;
        var topicCount = topics.length;
        while (topicCount--) {
            var topic = topics[topicCount];
            topic.time = moment(topic.modified).format("MMM Do YY, h:mma");
            topic.relativeTime = moment(topic.modified).fromNow();
            topic.isArchivable = (membershipId===topic.author.id) && (topic.opinions === 0) && (topic.endorse === 0);
            topic.author.image = this.api.getProfileImageURL(topic.author.id);
        }
        callback( { topics: { topic: topics } } );
    }

    this.registry.frmAddTopic = { attributes: { onsubmit : addTopic.bind(this)} };

    //==========================
    this.registry.tglOpinion = { attributes: { onclick : toggleOpinions.bind(this)} };

    function toggleOpinions (evt) {
        var topicElm = evt.target.closest('.topic');
        var opinions = topicElm.querySelector('.opinions');
        if (O.CSS.has (topicElm, 'hide-opinions')) {
            O.CSS.remove (topicElm, 'hide-opinions');
            opinions.setAttribute('data-register','opinionList');
            this.register(opinions);
        } else {
            O.CSS.add (topicElm, 'hide-opinions');
            opinions.removeAttribute('data-register');
        }
    }
    //==========================

    function addTopic (evt) {
        var content = O.ELM.topicContent.value;
        if (this.models.topic.content.validate(content, this.state.communityJSON)) {
            var data = {
                communityId : this.state.community,
                content: content,
                status: 'published'
            };
            this.api.addTopic(data, onTopicAdded.bind(this));
        }
        evt.detail.preventDefault();
    }

    function onTopicAdded () {
        loadTopicList.call(this, O.ELM.communityTopics);
    }

return this;}).call(app);