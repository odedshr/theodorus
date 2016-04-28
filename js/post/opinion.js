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
    var getProfileImageURL = this.api.getProfileImageURL;
    var community = this.state.communityJSON;
    var membershipId = community.membership ? community.membership.id : false;
    var opinions = data.opinions || [];
    var authors = data.authors || {};
    var count = opinions.length;
    var myOpinion;

    while (count--) {
      var item = opinions[count];
      item.author = authors[item.authorId];
      item.isMember = !!membershipId;
      item.isMine = (membershipId === item.author.id);
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();

      if (item.isMine) {
        myOpinion = item;

        item.isArchivable = (item.comments === 0) && (item.endorse === 0);
        opinions.splice(count,1);
      }
    }
    var authorIds = Object.keys(authors);
    count = authorIds.length;
    while (count--) {
      var id = authorIds[count];
      var author = authors[id];
      author.image = (!!author.hasImage) ? this.api.getProfileImageURL(id) : '';
    }
    if (membershipId) {
      if (myOpinion === undefined) {
        myOpinion = {
          author : {
            name : community.membership.name,
            image : getProfileImageURL(membershipId) },
          content: '',
          id: '',
          isMine: true,
          relativeTime: ''
        };
      }
      myOpinion.topicId = topicId;
      opinions.unshift(myOpinion);
    }
    callback( { opinions: { opinion: opinions } } );
  }

  //==========================

  this.registry.frmSetOpinion = { attributes : { onsubmit : setOpinion.bind(this) }};

  function setOpinion (evt) {
    var dElm = evt.target;
    var data = this.getFormFields (dElm);
    if (data.id.length === 0) {
      delete data.id;
    }
    this.api.setOpinion ({
      opinion: data
    } , onOpinionSaved.bind(this,dElm, (data.id === undefined) ));
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
