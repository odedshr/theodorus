app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.topicList = { preprocess: (function loadTopicList(dElm, callback) {
    var communityId = this.state.community;
    this.api.getCommunityTopics(communityId, topicListOnLoaded.bind(this, callback));
  }).bind(this) };

  function topicListOnLoaded(callback, list) {
    if (list instanceof Error) {
      this.log('failed to load topic list',this.logType.error);
      this.log(list,this.logType.debug);
      list = [];
    }

    var isMember = !!this.state.communityJSON.membership;
    var membershipId = isMember ? this.state.communityJSON.membership.id : false;
    var count = list.length;
    while (count--) {
      var item = list[count];
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      item.isArchivable =(membershipId === item.author.id) &&(item.opinions === 0) &&(item.endorse === 0);
      item.author.image = this.api.getProfileImageURL(item.author.id);
      item.isMember = isMember;
      item.isEndorsed = (!!item.viewpoint && !!item.viewpoint.endorse);
      item.isRead = (!!item.viewpoint && !!item.viewpoint.read);
      item.isFollowed = (!!item.viewpoint && !!item.viewpoint.follow);
    }
    callback( { topics: { topic: list } } );
  }

  this.registry.frmAddTopic = { attributes: { onsubmit : addTopic.bind(this)} };

  //==========================

  function addTopic(evt) {
    var content = O.ELM.topicContent.value;
    if(this.models.topic.content.validate(content, this.state.communityJSON)) {
      var data = {
        communityId : this.state.community,
        content: content,
        status: 'published',
      };
      this.api.addTopic(data, onTopicAdded.bind(this));
    }
    return false;
  }

  function onTopicAdded() {
    this.register(O.ELM.communityTopics);
  }

return this;}).call(app);
