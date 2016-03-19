app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';
  this.registry = this.registry || {};

  this.registry.commentList = { preprocess : (function loadCommentList  (dElm, callback) {
    var opinionId = dElm.getAttribute('data-opinion-id');
    var parentId = dElm.getAttribute('data-comment-id');
    this.api.getPostComments (opinionId, parentId, commentListOnLoaded.bind(this, opinionId, parentId, callback));
  }).bind(this) };

  function commentListOnLoaded ( opinionId, parentId, callback, data) {
    var list = data.comments || [];
    var authors = data.authors || {};
    var membershipId = this.state.communityJSON.membership ? this.state.communityJSON.membership.id : false;
    var count = list.length;
    while (count--) {
      var item = list[count];
      item.author = authors[item.authorId];
      item.author.image = this.api.getProfileImageURL(item.author.id);
      item.isEditable = (membershipId === item.author.id) && (item.comments === 0) && (item.endorse === 0);
      item.isArchivable = item.isEditable;
      item.isMember = !!membershipId;
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      if (item.isEditable) {
        item.opinionId = (opinionId ? opinionId : '');
        item.parentId = (parentId ? parentId : '');
      }
    }
    callback( { id: '', opinionId : (opinionId ? opinionId : ''), parentId : (parentId ? parentId : ''), content : '', comments: { comment: list } } );
  }

  //==========================

  this.registry.frmSetComment = { attributes: { onsubmit : setComment.bind(this)} };

  function setComment (evt) {
    var form = evt.target;
    var comment = this.getFormFields (form);
    var parentType, parentId;
    if (comment.parentId.length > 0) {
      parentType = 'comment';
      parentId = comment.parentId;
    } else {
      parentType = 'opinion';
      parentId = comment.opinionId;
      delete comment.parentId;
    }
    if (comment.id.length === 0) {
      delete comment.id;
    }
    if (this.models.comment.content.validate(comment.content, this.state.communityJSON)) {
      this.api.setComment ( {comment: comment}, onCommentAdded.bind(this, form, parentType, parentId, comment.id === undefined) );
    } else {
       this.log('bad comment',this.logType.error);
    }
    return false;
  }

  function onCommentAdded (dCommentForm, parentType, parentId, isCommentAdded) {
    if (isCommentAdded) {
      var dParent = O.ELM[parentType+'-'+parentId];
      this.updateCount(dParent, 'comment' ,+1);
      this.removeArchiveButton(parentType, parentId);
    }

    this.register(O.ELM[''.concat(parentType,'-',parentId,'-comments')]);
  }

return this;}).call(app);
