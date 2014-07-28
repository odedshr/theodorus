exports.getTests = function AbstractModelTestSuite () {
    var AbstractModelLibrary = require ("../www/js/models/AbstractModel.js"),
        AbstractModel = AbstractModelLibrary.model(),
        AbstractCollection = AbstractModelLibrary.collection();

    function expectException (assert, expectedError,test) {
        try {
            test();
        }
        catch (e) {
            assert.equal (expectedError,e,"got expected exception: "+ expectedError);
        }
        return false;
    }

    return [
        function testNewAbstractModelFailsForNoScehma(assert) {
            assert.throws(function (assert) {
                var model = new AbstractModel ();
            },"model-has-no-schema", "fails on model with no schema");
        },
        function testAbstactCollectionFailsForNoUrlOnGetPage(assert) {
            assert.throws(function (assert) {
                var collection = new AbstractCollection();
                return (collection.getPage()==false);
            },"called-getPage-on-collection-with-no-url", "fails on getPage on collection with no URL");
        },
        function testAbstactCollectionReturnOneForUrlWithNoPage(assert) {
            var collection = new AbstractCollection();
            collection.url = "a-url"
            assert.equal (collection.getPage(),1,"getPage with unnumbered url retrieved one");
        },
        function testAbstactCollectionReturnPageNumberForUrlWithPage(assert) {
            var collection = new AbstractCollection();
            collection.url = "a-url/:2"
            assert.equal (collection.getPage(),2,"getPage retrieved right page number");
        },
        function testAbstactCollectionFailsForNoUrlOnGetPage(assert) {
            assert.throws(function (assert) {
                var collection = new AbstractCollection();
                collection.setPage(2);
            },"called-setPage-on-collection-with-no-url", "fails on setPage on collection with no URL");
        },
        function testAbstactCollectionFailsForSetPageWithInvalidInput(assert) {
            assert.throws(function (assert) {
                var collection = new AbstractCollection();
                collection.url = "a-url";
                collection.setPage("invalidInput");
            },"pageNum-parameter-must-be-a-number", "fails on setPage invalid parameter");
        },
        function testAbstactCollectionSetPageForUrlWithNoPage(assert) {
            var collection = new AbstractCollection();
            collection.url = "a-url";
            assert.equal (collection.setPage(2).getPage(),2,"page with unnumbered url updated successfully");
        },
        function testAbstactCollectionSetPageForUrlWithPage(assert) {
            var collection = new AbstractCollection();
            collection.url = "a-url/:2"
            assert.equal (collection.setPage(3).getPage(),3,"page with numbered url updated successfully");
        },
    ];
}