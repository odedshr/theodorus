exports.getTests = function CommentTestSuite () {
    var Comment = require ("../www/js/models/Comment.js").model();

    return [
        function testCommentHasSchema(assert) {
            var comment = new Comment();
            assert.ok (typeof comment.schema == "object", "comment model has schema" );
        },

        function testCommentHasTable(assert) {
            var comment = new Comment();
            assert.ok ((comment.collection && (comment.collection.length>0) ), "comment has collection");
        }
    ];
}