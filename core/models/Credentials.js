var Credentials = ((typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model()).extend({
    collection: "credentials",
    key:"auth_key",
    schema: {
        "auth_key":"string",
        "password":"string",
        "user_id":"number"
    }
});

if (typeof exports !== "undefined") {
    exports.model = function () { return Credentials; };
}
