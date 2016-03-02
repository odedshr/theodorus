app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    O.EVT.subscribe('toggle-comment',toggleComments.bind(this));
    O.EVT.subscribe('submit-add-comment',addComment.bind(this));

    this.registry.tglComment = (function registerToggleComments (dElm, callback) {
        dElm.onclick = O.EVT.getDispatcher('toggle-comment');
        callback();
    }).bind(this);

    function toggleComments (evt) {
        var opinionElement = evt.detail.target.closest('[data-type="opinion"]');
        var parentElement = evt.detail.target.closest('[data-id]');
        var parentId = (opinionElement === parentElement) ? undefined : parentElement.getAttribute('data-id');
        var opinionId = opinionElement.getAttribute('data-id');
        var commentElm = opinionElement.querySelector('[data-role="comments"]');
        if (commentElm.getAttribute('data-hidden') === 'true') {
            O.ELM.per('[data-role="comments"]:not([data-hidden="true"])').each(function (dElement) {
                dElement.setAttribute('data-hidden', 'true');
                dElement.innerHTML = '';
            });
            loadComments.call(this, commentElm, opinionId, parentId);
            commentElm.removeAttribute('data-hidden');
        } else {
            commentElm.setAttribute('data-hidden', 'true');
        }
    }

    function loadComments (dElm, opinionId, parentId) {
        this.api.getPostComments(opinionId, parentId, renderCommentList.bind(this,dElm, opinionId, parentId));
    }

    function renderCommentList (dElm, opinionId, parentId, comments) {
        var count = comments.length;
        var membership = this.state.communityJSON.membership;
        var membershipId = membership ? membership.id : false;
        while (count--) {
            var comment = comments[count];
            comment.time = moment(comment.modified).format("MMM Do YY, h:mma");
            comment.relativeTime = moment(comment.modified).fromNow();
            comment.isArchivable = (membershipId===comment.author.id) && (comment.comments === 0) && (comment.endorse === 0);
        }
        var displayedData = {
            commentList:{
                commentId: '',
                opinionId: opinionId,
                parentId: parentId ? parentId : '',
                comments:{comment:comments}
            }
        };
        this.render(dElm, displayedData);
        this.register(dElm);
    }

    this.registry.frmAddComment = (function registerAddCommentForm (dElm, callback) {
        dElm.onsubmit = O.EVT.getDispatcher('submit-add-comment');
        callback();
    }).bind(this);

    function addComment (evt) {
        var content = O.ELM.commentContent.value;
        var opinionId = O.ELM.opinionId.value;
        var parentId = O.ELM.parentId.value;
        var commentId = O.ELM.commentId.value;
        if (parentId.length === 0) {
            parentId = undefined;
        }
        if (!this.models.comment.id.validate(commentId)) {
            this.log('commentId = ' + topicId);
        } else if (!this.models.comment.opinionId.validate(opinionId)) {
            this.log('opinionId = ' + topicId);
        } else if (!this.models.comment.parentId.validate(parentId)) {
            this.log('parentId = ' + parentId);
        } else if (!this.models.comment.content.validate(content, this.state.communityJSON)) {
            this.log('content = ' + content);
        } else {
            var data = {
                communityId : this.state.community,
                id : commentId,
                opinionId : opinionId,
                parentId : parentId,
                content: content,
                status: 'published'
            };
            this.api.setComment(data, commentAdded.bind(this,evt.detail.target.closest('[data-type][data-id]'), opinionId, parentId));
        }
        return false;
    }

    function commentAdded (dElm, opinionId, parentId) {
        this.updateCount(dElm,'comment',1);
        loadComments.call(this,dElm.querySelector('[data-role="comments"]'), opinionId, parentId);
    }

return this;}).call(app);