app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.opinionList = { preprocess : (function loadOpinionList  (dElm, callback) {
    var topicId = dElm.getAttribute('data-topic-id');
    this.api.getTopicOpinions (topicId, opinionListOnLoaded.bind(this, topicId, callback));
  }).bind(this) };

  function opinionListOnLoaded (topicId, callback, list) {
    var getProfileImageURL = this.api.getProfileImageURL;
    var community = this.state.communityJSON;
    var membershipId = community.membership ? community.membership.id : false;
    var count = list.length;
    var myOpinion;

    while (count--) {
      var item = list[count];
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      item.author.image = getProfileImageURL(item.author.id);
      item.isMine = (membershipId === item.author.id);
      item.includeAttributes = true;
      if (item.isMine) {
        myOpinion = item;

        item.isArchivable = (item.comments === 0) && (item.endorse === 0);
        list.splice(count,1);
      }
    }
    if (myOpinion === undefined) {
      myOpinion = {
        author : {
          name : community.membership.name,
          image : getProfileImageURL(membershipId) },
        content: '',
        id: '',
        isMine: true,
        includeAttributes : false,
        relativeTime: ''
      };
    }
    myOpinion.topicId = topicId;
    list.unshift(myOpinion);
    callback( { opinions: { opinion: list } } );
  }

  //==========================

  this.registry.frmSetOpinion = { attributes : { onsubmit : setOpinion.bind(this) }};

  function setOpinion (evt) {
    var dElm = evt.target;
    var data = this.getFormFields (dElm);
    this.api.setOpinion (data , onOpinionSaved.bind(this,dElm, data.id.length > 0));
    return false;
  }

  function onOpinionSaved (dElm, isOpinionAdded) {
    var dTopicContent = dElm.closest('[data-id][data-type="topic"]');
    var topicId = dTopicContent.getAttributes('data-id');

    if (isOpinionAdded) {
      this.updateCount(dTopicContent, 'opinion' ,+1);
      this.removeArchiveButton('topic', topicId);
    }

    this.register(O.ELM['#'.concat('topic-',topicId,'-comments')]);
  }

return this;}).call(app);
