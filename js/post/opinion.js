app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.opinionList = { preprocess : (function loadOpinionList  (dElm, callback) {
    var topicId = dElm.getAttribute('data-topic-id');
    this.api.getTopicOpinions (topicId, opinionListOnLoaded.bind(this, topicId, callback));
  }).bind(this) };

  function opinionListOnLoaded (topicId, callback, data) {
    var item, viewpoint;
    var getProfileImageURL = this.api.getProfileImageURL;
    var community = this.state.communityJSON;
    var membershipId = community.membership ? community.membership.id : false;
    var opinions = data.opinions || [];
    var authors = data.authors || {};
    var myOpinion;

    this.addImagesToAuthors (authors);

    for (var i = 0, length = opinions.length; i < length; i++) {
      item = opinions[i];
      item.author = authors[item.authorId];
      item.mdContent = this.htmlize(item.content);
      item.isMember = !!membershipId;
      item.isMine = (membershipId === item.author.id);
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      item.hasStats = true;
      item.images = { image: this.getAttachmentsURL(item.images) };

      if (item.isMine) {
        myOpinion = item;
        item.isEditable = (item.comments === 0) && (item.endorse === 0);
        opinions.splice(count,1);
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
    if (membershipId) {
      if (myOpinion === undefined) {
        myOpinion = {
          author : {
            name : community.membership.name,
            image : getProfileImageURL(membershipId) },
          content: '',
          mdContent: '',
          images: { image: [] },
          id: '',
          isMine: true,
          isEditable: true,
          relativeTime: '',
        };
      }
      myOpinion.topicId = topicId;
      myOpinion.isReadMode = true;
      myOpinion.contentLength = this
        .getPostLengthString(myOpinion.content, community.opinionLength);
      opinions.unshift(myOpinion);
    }
    callback( { opinions: { opinion: opinions } } );
  }

  //////////////////////////////////////////////////////////////////////////////

  this.registry.frmSetOpinion = { attributes : { onsubmit : setOpinion.bind(this) }};

  function setOpinion (evt) {
    var dForm = evt.target;
    var data = {
        opinion: this.getFormFields (dForm),
        images: {
          added: this.getAttachedImages(dForm),
          removed: this.getDetachedImages(dForm)
        }
    };
    if (data.opinion.id.length === 0) {
      delete data.opinion.id;
    }
    this.api.setOpinion (data , onOpinionSaved.bind(this, dForm, (data.opinion.id === undefined) ));
    return false;
  }

  function onOpinionSaved (dElm, isOpinionAdded, response) {
    if (response instanceof Error) {
      this.log(response,this.logType.error);
    } else {
      var dTopicContent = dElm.closest('[data-id][data-type="topic"]');
      var topicId = dTopicContent.getAttribute ('data-id');

      if (isOpinionAdded) {
        this.updateCount(dTopicContent, 'opinion' ,+1);
        this.removeArchiveButton('topic', topicId);
      }

      this.register(O.ELM[''.concat('topic-',topicId,'-opinions')]);
    }
  }

return this;}).call(app);
