exports.getTests = function TopicTestSuite () {
    var Topic = (require ("../src/models/Topic.js")).model();

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
        function testTopicHasSchema(assert) {
            var topic = new Topic();
            assert.ok (typeof topic.schema == "object","topic has a schema" );
        },

        function testTopicHasTable(assert) {
            var topic = new Topic();
            assert.ok (topic.collection && (topic.collection.length>0), "topic has a collection" );
        },

        // /^[a-zA-Z0-9\-\.%_]{5,140}$/

        function testTopicSlugIsValid(assert) {
            assert.ok (Topic.isSlugValid("a-valid-slug"), "slug is valid" );
        },

        function testTopicSlugIsTooShort(assert) {
            assert.ok (!Topic.isSlugValid("shor"), "slug is too short" );
        },

        function testTopicSlugIsTooLong(assert) {
            assert.ok (!Topic.isSlugValid("012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"), "slug is too long" );
        },

        function testTopicSlugIsInvalidCharacters(assert) {
            assert.ok (!Topic.isSlugValid("!? ##"), "slug is invalid" );
        },

        function testTopicIncrementStatusFailsOnModel(assert) {
            var status = false;
            try {
                status = Topic.incrementStatus();
            } catch (e) {
                // do nothing
            }

            assert.ok (!status, "cannot increment status of Topic Model" );
        },

        function testTopicIncrementStatusIncrementIdeaToDiscussion(assert) {
            var status = false,
                topic = new Topic({"status":"idea"});
            try {
                status = topic.incrementStatus();
            } catch (e) {
                // do nothing
            }

            assert.ok (status=="discussion", "cannot increment status from idea to discussion" );
        },

        function testTopicIncrementStatusKeepAgreementAsIs(assert) {
            var status = false,
                topic = new Topic({"status":"agreement"});
            try {
                status = topic.incrementStatus();
            } catch (e) {
                // do nothing
            }

            assert.ok (status=="agreement", "cannot increment status from idea to discussion" );
        },
    ];
};