/* globals before, xdescribe */
;(function postyRouteTestEnclosure() {
  'use strict';

  var assert = require('assert'),
      testUtils = require('./testUtils.js'),
      Post = require('../src/backend/models/Post.model.js');

  describe('postRouterTest', function postRouterTest() {
    var founderToken,
        communityId,
        founderId,
        testId = (new Date()).getTime(),
        founderEmail = 'founder-' + testId + '@test.suite.post',

        communityName = 'post-public-' + testId,
        founderAlias = 'post-public-founder-' + testId,

        postId,
        tag1 = testUtils.getRandomTag(),
        tag2 = testUtils.getRandomTag(),
        postContent1 = 'content1 #' + tag1,
        postContent2 = 'content2 #' + tag1 + ' #' + tag2,
        postContent3 = 'content3 #' + tag2,

        topicId,
        opinionId,
        topicContent = 'topic1',
        opinionContent1 = 'content1',
        opinionContent2 = 'content2',
        opinionContent3 = 'content3',
        opinionContent4 = 'content4';

    before(function beforeTests(done) {
      createUserFounder(createCommunity.bind(null, done));
    });

    function createUserFounder(callback) {
      testUtils.withTokenOf(founderEmail, function(gotToken1) {
        founderToken = gotToken1;
        callback();
      });
    }

    function createCommunity(callback) {
      testUtils.addCommunity(founderToken, {
        community: { name: communityName, postLength: 3 },
        founder: { alias: founderAlias }
      }, function(data) {
        communityId = data.community.id;
        founderId = data.founder.id;
        callback();
      });
    }

    describe('Simple Posts (topics)', function simplePosts() {
      describe('PUT /community/[communityId]/posts', function putCommunityTopic() {
        it('fail to add post because content is too long', function addingTooLongTopic(done) {
          var content = 'content is too long';

          function onFailedToAddPost(error, response) {
            var data;

            assert.equal(error, null, 'no errors requesting token');
            data = JSON.parse(response.text);

            assert.equal(data.message, 'too-long', 'got a too-long error message');
            assert.equal(data.details.value, content, 'content is as expected');
            done();
          }

          testUtils.REST()
            .put('/api/community/' + communityId + '/posts')
            .set('authorization', founderToken)
            .send({ post: { content: content } })
            .expect(406)
            .end(onFailedToAddPost);
        });

        it('successfully add a post', function addPost(done) {
          function onPostAdded(data) {
            assert.equal(data.post.content, postContent1, 'content is as expected');
            assert.equal(data.community.posts, 1, 'community has one post');
            postId = data.post.id;
            done();
          }

          testUtils.REST()
            .put('/api/community/' + communityId + '/posts')
            .set('authorization', founderToken)
            .send({ post: { content: postContent1 } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, onPostAdded));
        });
      });
      describe('GET /community/[communityId]/posts', function getCommunityTopics() {
        it('successfully get the post list', function getTopics(done) {
          function gotTopics(data) {
            assert.equal(data.posts.length, 1, 'post list has 1 post');
            assert.equal(data.authors[data.posts[0].authorId].alias, founderAlias, 'author name is as expected');
            done();
          }

          testUtils.REST()
            .get('/api/community/' + communityId + '/posts')
            .expect(200)
            .end(testUtils.parseResponse.bind(null, gotTopics));

        });
      });
      describe('POST /post', function postCommunity() {
        it('fail to update post with inexistent parent', function updateTopic(done) {

          function postFailToUpdate(data) {
            assert.equal(data.message, 'not-found', 'got an Not-Found error message');
            assert.equal(data.details.key, 'parent', 'the missing key is "Parent"');
            done();
          }

          testUtils.REST()
            .post('/api/post')
            .set('authorization', founderToken)
            .send({ post: { parentId: '0', content: postContent2 } })
            .expect(404)
            .end(testUtils.parseResponse.bind(null, postFailToUpdate));

        });
        it('successfully update post', function updateTopic(done) {

          function postUpdated(data) {
            assert.equal(data.post.content, postContent2, 'content is updated as expected');
            assert.equal(data.author.alias, founderAlias, 'author name is as expected');
            done();
          }

          testUtils.REST()
            .post('/api/post')
            .set('authorization', founderToken)
            .send({ post: { id: postId, content: postContent2 } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, postUpdated));

        });
      });
      describe('GET /post/[postId]', function getTopic() {
        it('successfully update existing post', function getSingleTopic(done) {
          function gotTopic(data) {
            assert.equal(data.post.content, postContent2, 'content is updated as expected');
            assert.equal(data.author.alias, founderAlias, 'author name is as expected');
            done();
          }

          assert.ok(postId !== undefined, 'postId is not undefined');
          testUtils.REST()
            .get('/api/post/' + postId)
            .set('authorization', founderToken)
            .expect(200)
            .end(testUtils.parseResponse.bind(null, gotTopic));

        });
      });
      describe('POST /api/post/[postId]', function postTopic() {
        it('successfully update existing post', function updateTopic2(done) {

          function postUpdated(data) {
            assert.equal(data.post.content, postContent3, 'content is updated as expected');
            assert.equal(data.community.posts, 3, 'community has two posts');
            done();
          }

          assert.ok(postId !== undefined, 'postId is not undefined');
          testUtils.REST()
            .post('/api/post/' + postId)
            .set('authorization', founderToken)
            .send({ post: { content: postContent3 } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, postUpdated));

        });
      });

      //TODO: fixed get/post/tag
      xdescribe('GET /post/tag/', function getCommunityTags() {
        it('should successfully get tagged communityList', function getTaggedCommunityListSuccess(done) {
          function gotTaggedList(err, data) {
            console.log(err, data);
            assert.ok((data.posts.length > 0), 'posts list is not empty');
            assert.ok((data.tags[data.posts[0].id][0] === tag1), 'tag is as expected');
            assert.ok((data.tags[data.posts[0].id].length === 1), 'community has 1 tag as expected');
            done();
          }

          testUtils.REST()
            .get('/api/post/tag/' + tag1)
            .set('authorization', founderToken)
            .expect(200)
            .end(gotTaggedList);
        });
      });

      //TODO: fix number of decendants posts
      xdescribe('DELETE /post/[postId]', function deleteTopic() {
        it('successfully update existing post', function updateTopic2(done) {

          function postUpdated(data) {
            assert.equal(data.post.status, 'archived', 'post status is archived');
            assert.equal(data.community.posts, 0, 'community has no posts');
            done();
          }

          assert.ok(postId !== undefined, 'postId is not undefined');
          testUtils.REST()
            .delete('/api/post/' + postId)
            .set('authorization', founderToken)
            .expect(200)
            .end(testUtils.parseResponse.bind(null, postUpdated));
        });
      });
    });

    xdescribe('Starred Posts (opinions)', function starredPosts() {
      function addTopic(callback) {
        testUtils.addTopic(founderToken, communityId, {
          post: { content: topicContent }
        }, function(data) {
          topicId = data.post.id;
          callback();
        });
      }

      before(function beforeTests(done) {
        addTopic(done);
      });

      xdescribe('PUT /post/[postId]/posts', function() {
        it('fail to add starred post because content is too long', function addingTooLongPost(done) {
          var content = 'content is too long';

          function onFailedToAddOpinion(data) {
            console.log(data);
            assert.equal(data.message, 'too-long', 'got a too-long error message');
            assert.equal(data.details.value, content, 'content is as expected');
            done();
          }

          testUtils.REST()
            .put('/api/post/' + postId + '/posts')
            .set('authorization', founderToken)
            .send({ post: { content: content,
                            status: Post.schema.status.starred } })
            .expect(406)
            .end(testUtils.parseResponse.bind(null, onFailedToAddOpinion));
        });

        it('successfully add an opinion', function addPost(done) {
          function onOpinionAdded(data) {
            assert.equal(data.opinion.content, opinionContent1, 'content is as expected');
            assert.equal(data.topic.opinions, 1, 'topic has one opinion');
            done();
          }

          testUtils.REST()
            .put('/api/post/' + topicId + '/posts')
            .set('authorization', founderToken)
            .send({ post: { content: opinionContent1,
                            status: Post.schema.status.starred } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, onOpinionAdded));
        });

        it('successfully update a opinion #1', function addPost(done) {
          function onOpinionAdded(data) {
            assert.equal(data.post.content, opinionContent2, 'content is as expected');
            assert.equal(data.post.status, Post.schema.status.starred, 'post is starred');
            opinionId = data.opinion.id;
            done();
          }

          testUtils.REST()
            .put('/api/post/' + topicId + '/posts')
            .set('authorization', founderToken)
            .send({ post: { content: opinionContent2,
                            status: Post.schema.status.starred } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, onOpinionAdded));
        });
      });

      xdescribe('GET /topic/[topicId]/opinions', function getOpinionList() {
        it('successfully get the opinion list', function getOpinions(done) {
          function gotOpinions(data) {
            var opinion;

            assert.equal(data.opinions.length, 1, 'opinion list has 1 opinion');
            opinion = data.opinions[0];

            assert.equal(data.authors[opinion.authorId].alias, founderAlias, 'author name is as expected');
            assert.equal(data.history[opinion.authorId][0].content, opinionContent1, 'history content is as expected');
            done();
          }

          testUtils.REST()
            .get('/topic/' + topicId + '/opinions')
            .expect(200)
            .end(testUtils.parseResponse.bind(null, gotOpinions));
        });
      });

      xdescribe('POST /opinion', function() {
        it('successfully update a opinoin #2', function updateOpinion2(done) {
          function onOpinionUpdated(data) {
            assert.equal(data.opinion.content, opinionContent3, 'content is as expected');
            assert.equal(data.history.length, 2, 'opinion has 2 history elements');
            // sorted by modified DESC
            assert.equal(data.history[0].content, opinionContent2, 'history content #1 is as expected');
            assert.equal(data.history[1].content, opinionContent1, 'history content #2 is as expected');
            opinionId = data.opinion.id;
            done();
          }

          testUtils.REST()
            .post('/opinion/')
            .set('authorization', founderToken)
            .send({ opinion: { id: opinionId, content: opinionContent3 } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, onOpinionUpdated));
        });
      });

      xdescribe('GET /opinion/[opinionId]', function getOpinion() {
        it('successfully get an opinion', function getOneOpinion(done) {
          function onGotOpinion(data) {
            assert.equal(data.opinion.content, opinionContent3, 'content is as expected');
            assert.equal(data.history.length, 2, 'opinion has 2 history elements');
            assert.equal(data.history[0].content, opinionContent2, 'history content #1 is as expected');
            assert.equal(data.history[1].content, opinionContent1, 'history content #2 is as expected');
            opinionId = data.opinion.id;
            done();
          }

          testUtils.REST()
            .get('/opinion/' + opinionId)
            .send({ opinion: { content: opinionContent3 } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, onGotOpinion));
        });
      });

      xdescribe('POST /opinion/[opinionId]', function() {
        it('successfully update a opinoin #3', function updateOpinion3(done) {
          function onOpinionUpdated(data) {
            assert.equal(data.opinion.content, opinionContent4, 'content is as expected');
            assert.equal(data.history.length, 3, 'opinion has 3 history elements');
            assert.equal(data.history[0].content, opinionContent3, 'history content #1 is as expected');
            assert.equal(data.history[1].content, opinionContent2, 'history content #2 is as expected');
            assert.equal(data.history[2].content, opinionContent1, 'history content #3 is as expected');
            opinionId = data.opinion.id;
            done();
          }

          testUtils.REST()
            .post('/opinion/' + opinionId)
            .set('authorization', founderToken)
            .send({ opinion: { content: opinionContent4 } })
            .expect(200)
            .end(testUtils.parseResponse.bind(null, onOpinionUpdated));
        });
      });

      xdescribe('DELETE /opinion/[opinionId]', function() {
        it('successfully archive an opinion', function archiveOpinion(done) {
          function opinionArchived(data) {
            assert.equal(data.opinion.status, 'archived', 'opinion status is archived');
            done();
          }

          testUtils.REST()
            .delete('/opinion/' + opinionId)
            .set('authorization', founderToken)
            .expect(200)
            .end(testUtils.parseResponse.bind(null, opinionArchived));
        });
      });
    });
  });
})();
