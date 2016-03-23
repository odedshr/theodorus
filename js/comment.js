app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.commentList = { preprocess : (function loadCommentList  (dElm, callback) {
        var opinionId = dElm.getAttribute('data-opinion-id');
        var parentId = dElm.getAttribute('data-comment-id');
        this.api.getPostComments (opinionId, parentId, commentListOnLoaded.bind(this, opinionId, parentId, callback));
    }).bind(this) };

    function commentListOnLoaded ( opinionId, parentId, callback, list) {
        var membershipId = this.state.communityJSON.membership ? this.state.communityJSON.membership.id : false;
        var count = list.length;
        while (count--) {
            var item = list[count];
            item.author.image = this.api.getProfileImageURL(item.author.id);
            item.time = moment(item.modified).format("MMM Do YY, h:mma");
            item.relativeTime = moment(item.modified).fromNow();
            item.isEditable = (membershipId === item.author.id) && (item.comments === 0) && (item.endorse === 0);
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
        var data = this.getFormFields (evt.target);
        var parentType = (data.opinionId.length === 0) ? 'comment' : 'opinion';
        var parentId = data.parentId;
        switch (parentType) {
            case 'opinion':
                parentId = data.opinionId;
                delete data.parentId;
                break;
            case 'comment':
                delete data.opinionId;
                break;
        }
        if (this.models.comment.content.validate(data.content, this.state.communityJSON)) {
            this.api.setComment ( data, onCommentAdded.bind(this, evt.target, parentType, parentId, data.id.length === 0) );
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