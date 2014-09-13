exports.getTests = function TagTestSuite () {
    var methods = require("./process.js").init({
            config: require("../../../config.json"),
            db: {
                verifyExistance: function (model, callback) { callback();},
                getTopics: function (parameters, callback) { callback(); }
            }
        }),
        library = require ("./Tag.js"),
        Tag = library.model();

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

        function testMethodsLoaded(assert) {
            assert.ok(methods.length>0,"methods loaded");
        },

        function testMethodsLoaded(assert) {
            assert.ok(methods.length>0,"methods loaded");
        },
    ];
}