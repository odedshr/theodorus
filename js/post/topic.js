app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  var filters = {};

  this.registry.topicList = { preprocess: (loadTopicList).bind(this) };

  function loadTopicList(dElm, callback) {
    var communityId = this.state.community;
    var cached = this.registry.topicList.cached;
    if (!!cached) { //used cache
      callback( { topics: { topic: this.getFilteredItems.call (this, cached, filters ) } } );
    } else {
      this.api.getCommunityTopics(communityId, topicListOnLoaded.bind(this, callback));
    }
  }

  function topicListOnLoaded(callback, data) {
    if (data instanceof Error) {
      this.log('failed to load topic list',this.logType.error);
      this.log(data,this.logType.debug);
      return callback ({ topics: { topic: [] } });
    }
    this.state.communityTopics = data;

    var topics = data.topics || [];
    var authors = data.authors || {};
    var isMember = !!this.state.communityJSON.membership;
    var membershipId = isMember ? this.state.communityJSON.membership.id : false;
    var count = topics.length;
    while (count--) {
      var item = topics[count];
      item.author = authors[item.authorId];
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      item.isArchivable =(membershipId === item.author.id) &&(item.opinions === 0) &&(item.endorse === 0);
      item.isMember = isMember;
      if (item.viewpoint) {
        item.isEndorsed = !!item.viewpoint.endorse;
        item.isFollowed = !!item.viewpoint.follow;
        item.isRead = !!item.viewpoint.read;
      } else {
        item.isEndorsed = item.isFollowed = item.isRead = false;
      }

    }
    var authorIds = Object.keys(authors);
    count = authorIds.length;
    while (count--) {
      var id = authorIds[count];
      var author = authors[id];
      author.image = (!!author.hasImage) ? this.api.getProfileImageURL(id) : '';
    }

    callback( { topics: { topic: this.getFilteredItems.call (this, topics, filters ) } } );
  }

  //==========================

  this.registry.frmAddTopic = { attributes: { onsubmit : addTopic.bind(this)} };
  function addTopic(evt) {
    var content = O.ELM.topicContent.value;
    if(this.models.topic.content.validate(content, this.state.communityJSON)) {
      var data = { topic: {
        communityId : this.state.community,
        content: content,
        status: 'published',
      }};
      this.api.setTopic (data, onTopicAdded.bind(this));
    }
    return false;
  }

  function onTopicAdded() {
    delete this.state.communityTopics;
    this.register(O.ELM.communityTopics);
  }

  //==========================

  this.registry.filterTopics = { attributes: { onkeyup : filterTopics.bind(this)} };
  function filterTopics (evt) {
    filters.content = evt.target.value;
    this.registry.topicList.cached = this.state.communityTopics.topics;
    this.register(document.querySelector('[data-register="topicList"]'));
    delete this.registry.topicList.cached;
  }
return this;}).call(app);
