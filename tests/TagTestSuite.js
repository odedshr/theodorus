exports.getTests = function TagTestSuite () {
    var library = require ("../www/plugins/tags/Tag.js"),
        Tag = library.model(),
        Tags = library.collection();

    function expectException (expectedError,test) {
        try {
            test();
        }
        catch (e) {
            if (e==expectedError) {
                return true;
            } else {
                throw e;
            }
        }
        return false;
    }

    return [
        function testTagHasSchema(assert) {
            var tag = new Tag();
            assert.ok (typeof tag.schema == "object","tag model has schema" );
        },

        function testTagHasTable(assert) {
            var tag = new Tag();
            assert.ok (tag.collection && (tag.collection.length>0), "tag has a collection" );
        },

        function testTagsHasUrl(assert) {
            var tags = new Tags();
            assert.ok((tags.url && (tags.url.length>0) ),"tags has collection");
        },
    ];
}