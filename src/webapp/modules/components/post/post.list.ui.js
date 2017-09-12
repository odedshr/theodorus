/* global appName, moment */
;(function postListUiPage(scope) {
  'use strict';

  function postList() {}

  postList.prototype = {
    init: function render(dElm) {
      var communityId = dElm.getAttribute('data-community'),
          parentId = dElm.getAttribute('data-post'),
          level = +dElm.getAttribute('data-level') || 0;

      if (!!parentId) {
        scope.io.post.listComments(parentId, this.process.bind(this, level, parentId, this.draw.bind(this, dElm)));
      } else if (!!communityId) {
        scope.io.post.list(communityId, this.process.bind(this, level, undefined, this.draw.bind(this, dElm)));
      } else {
        throw new scope.error.missingInput('communityId');
      }
    },

    process:   function processPostList(level, parentId, callback, data) {
      var isGroupedByAuthor = (level === 1),
          community = scope.state.community,
          communities,
          output = {
            parentId: parentId || '',
            communityId: community ? community.id : '',
            posts: [],
            isMember: community && !!community.membership,
            maxPostLength: community.postLength || 0
          };

      if (!data || data instanceof Error) {
        scope.log('failed to load post list', scope.log.type.error);
        scope.log(data, scope.log.type.debug);

        return callback({ items: [] });
      }

      data.level = level + 1;
      communities = data.communities;

      if (data.communities === undefined) { //the entire list is from a single community;
        data.communities = {};
        data.communities[community.id] = community;
      }

      (data.posts || []).forEach(this._addPostToOutput.bind(this, output, data, isGroupedByAuthor));

      return callback(output);
    },

    _addPostToOutput: function _addPostToOutput(output, data, isGroupedByAuthor, post) {
      var compiledPost = this._compilePost(data, post),
          author;

      if (isGroupedByAuthor) {
        author = data.authors[compiledPost.author.id];

        if (author.post === undefined) {
          compiledPost.history = [];
          author.post = compiledPost;
          output.posts.push(compiledPost);
        } else {
          author.post.history.push(compiledPost);
        }
      } else {
        output.posts.push(compiledPost);
      }
    },

    _compilePost: function _compilePost(data, post) {
      var community = (data.communities !== undefined) ? data.communities[post.communityId] : undefined,
          review = (data.reviews || {})[post.id],
          output = {
            id: post.id,
            level: data.level,
            author: data.authors[post.authorId],
            hasCommunity: !!community,
            community: community,
            mdContent: scope.strings.mdToHtml(post.content),
            time: moment(post.modified).format('MMM Do YY, h:mma'),
            relativeTime: moment(post.modified).fromNow(),
            //images: scope.posts.getAttachmentsURL(post.images),
            isMember: !!community && !!community.membership,
            isEditable: false,
            isEditMode: false,
            hasImage: !!post.hasImage,
            image: (!!post.hasImage) ? scope.api.getProfileImageURL(post.id) : '',
            statistics: scope.ui.post.getPostStatistics(post)
          };

      if (output.isMember) {
        output.isEditable = (community.membership.id === output.author.id);

        if (post.isEditable) {
          post.contentLength = scope.textField.getLengthString(output.content, community.postLength);
        }

        if (review) {
          output.isEndorsed = !!review.endorse;
          output.isFollowed = !!review.follow;
          output.isRead = !!review.read;
        } else {
          output.isEndorsed = output.isFollowed = output.isRead = false;
        }
      }

      return output;
    },

    draw: function drawTopicList(dElm, data) {
      dElm.innerHTML = scope.template.render({ postList: data });
      scope.ui.invokeChildren(dElm);
    }
  };

  scope.onReady(function() {
    scope.ui.add(postList);
  });

})(window[appName]);
