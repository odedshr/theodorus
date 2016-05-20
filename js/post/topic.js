app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  var filters = {};

  this.registry.topicList = { preprocess: loadCommunityTopics.bind(this) };

  function loadCommunityTopics(dElm, callback) {
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
    var item, viewpoint, isMember, membershipId, community;
    var topics = data.topics || [];
    var authors = data.authors || {};
    var communities = data.communities;
    if (communities === undefined) { //the entire list is from a single community;
      isMember = this.state.communityJSON && !!this.state.communityJSON.membership;
      membershipId = isMember ? this.state.communityJSON.membership.id : false;
    }


    this.addImagesToAuthors (authors);

    for (var i =0, length = topics.length; i < length; i++) {
      item = topics[i];
      item.author = authors[item.authorId];
      item.hasCommunity = (communities !== undefined);
      if (item.hasCommunity) {
        community = communities[item.communityId];
        item.community = community;
      }
      item.mdContent = this.htmlize(item.content);
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      item.images = { image: this.getAttachmentsURL(item.images) };
      item.isMember = isMember;
      if (isMember) {
        item.isReadMode = true;
        item.isEditable =(membershipId === item.author.id) &&(item.opinions === 0) &&(item.endorse === 0);
        if (item.isEditable) {
          item.contentLength = this
            .getPostLengthString(item.content, this.state.communityJSON.topicLength);
        }
        viewpoint = data.viewpoints[item.id];
        if (viewpoint) {
          item.isEndorsed = !!viewpoint.endorse;
          item.isFollowed = !!viewpoint.follow;
          item.isRead = !!viewpoint.read;
        } else {
          item.isEndorsed = item.isFollowed = item.isRead = false;
        }
      }
    }

    callback( { content:'',
      topics: { topic:
        this.getFilteredItems.call (this, topics, filters ) } } );
  }
  this.processTopicList = topicListOnLoaded.bind(this);

  //////////////////////////////////////////////////////////////////////////////

  this.registry.frmSetTopic = { attributes: { onsubmit : setTopic.bind(this)} };
  function setTopic(evt) {
    var form = evt.target;
    var data, topic = this.getFormFields (form);
    var content = topic.content;
    var isValid = this.models.topic.content
      .validate(content, this.state.communityJSON);
    if (!(isValid instanceof Error)) {
      data = {
        topic: {
          communityId : this.state.community,
          content: content,
          status: 'published',
        },
        images: {
          added: this.getAttachedImages(form),
          removed: this.getDetachedImages(form)
        }
      };
      if (topic.id.length > 0) {
        data.topic.id = topic.id;
      }
      this.api.setTopic (data, onTopicSet.bind(this));
    }
    return false;
  }

  function onTopicSet() {
    delete this.state.communityTopics;
    this.register(O.ELM.communityTopics);
  }

  //////////////////////////////////////////////////////////////////////////////

  this.registry.filterTopics = { attributes: { onkeyup :
    filterTopics.bind(this)} };
  function filterTopics (evt) {
    filters.content = evt.target.value;
    this.registry.topicList.cached = this.state.communityTopics.topics;
    this.register(document.querySelector('[data-register="topicList"]'));
    delete this.registry.topicList.cached;
  }

  //////////////////////////////////////////////////////////////////////////////


  this.registry.topTopics = { preprocess: (getTopTopics).bind(this), template: 'topicList' };

  function getTopTopics(dElm, callback) {
    var cached = this.registry.topTopics.cached;
    if (!!cached) { //used cache
      callback( { topics: { topic: this.getFilteredItems.call (this, cached, filters ) } } );
    } else {
      this.api.getTopTopics(1, 100, topicListOnLoaded.bind(this, callback));
    }
  }
return this;}).call(app);
