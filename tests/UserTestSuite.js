exports.getTests = function UserTestSuite () {
    var User = require ("./User.js").model();

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
        function testUserHasSchema(assert) {
            var user = new User();
            assert.ok (typeof user.schema == "object", "user has a schema" );
        },

        function testUserHasTable(assert) {
            var user = new User();
            assert.ok (user.collection && (user.collection.length>0),"user has a collection" );
        },

        function testUserCanDoSomething(assert) {
            var user = new User();
            user.set("permissions",{"suggest":true});
            assert.ok (user.can("suggest"),"user have permissions to suggest" );
        },

        function testUserPassOnNoPermissions(assert) {
            var user = new User();
            user.unset("permissions");
            assert.ok (!user.can("suggest") ,"user have no permissions");
        },

        function testUserCanNotDoSomething(assert) {
            var user = new User();
            user.set("permissions",{"suggest":true});
            assert.ok (!user.can("fly"),"user does not have permission to fly" );
        }
    ];
};