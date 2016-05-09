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
    var item, viewpoint;
    var list = data.comments || [];
    var community = this.state.communityJSON;
    var authors = data.authors || {};
    var membershipId = community.membership ? community.membership.id : false;
    var count = list.length;

    this.addImagesToAuthors (authors);

    while (count--) {
      item = list[count];
      item.author = authors[item.authorId];
      item.mdContent = marked(item.content);
      item.isEditable = (membershipId === item.author.id) && (item.comments === 0) && (item.endorse === 0);
      item.isMember = !!membershipId;
      item.time = moment(item.modified).format("MMM Do YY, h:mma");
      item.relativeTime = moment(item.modified).fromNow();
      item.images = { image: this.getAttachmentsURL(item.images) };
      if (item.isEditable) {
        item.opinionId = (opinionId ? opinionId : '');
        item.parentId = (parentId ? parentId : '');
        item.isReadMode = true;
        item.contentLength = this.getPostLengthString(item.content, community.opinionLength);
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
    callback( {
      emptyComment: {
        id: '',
        opinionId : (opinionId ? opinionId : ''),
        parentId : (parentId ? parentId : ''),
        content : '',
        isReadMode: false,
        images: { image: [] },
        contentLength: this.getPostLengthString('', community.opinionLength)
      },
      comments: { comment: list } } );
  }

  //////////////////////////////////////////////////////////////////////////////

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
      var data = {
        comment: comment,
        images: {
          added: this.getAttachedImages(form),
          removed: this.getDetachedImages(form)
        }
      };
      this.api.setComment ( data, onCommentAdded.bind(this, form, parentType, parentId, comment.id === undefined) );
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
