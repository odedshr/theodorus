var DEFAULT_LANGUAGE = "he",
    AbstractModel = ((typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel")).model();

var User = AbstractModel.extend({
    autoId: true,
    defaults: {
        "score": 0,
        "language": DEFAULT_LANGUAGE,
        permissions: {} // user with default might be anonymous who doesn't have any permissions
    },

    can: function (action) {
        var permissions = this.get("permissions");
        if (typeof permissions == "undefined") {
            permissions = {};
            this.set("permissions",permissions);
        }
        var permission = permissions[action];
        return ((typeof permission != "undefined") && permission);
    },

    collection: "users",
    key:"user_id",
    // this is the public information of the account, that anyone can see
    schema: {
        "user_id":"number",
        "slug":"string",
        "display_name":"string",
        "score":"number",
        "badges":"array",
        "isPolitician":"boolean",
        "bio":"string"
    }
});

User.initialPermissions = {"suggest":true,"feedback":true,"comment":true};

User.Account = User.extend({
    schema: { // This is all the information
        "user_id":"number",
        "slug":"string",
        "display_name":"string",
        "SN":"string",
        "isSNVerified":"boolean",
        "isModerator":"boolean",
        "isPolitician":"boolean",
        "picture":"string",
        "birthday":"string",
        "language":"string",
        "score":"number",
        "penalties":"number",
        "permissions":"array",
        "revoked":"array",
        "badges":"array"
    }
});

User.Topic = {
    collection: "user_topic",
    key:["user_id","topic_id"],
    schema: {
        "user_id":"number",
        "topic_id":"number",
        "seen":"boolean",
        "follow":"boolean",
        "endorse":"boolean",
        "report":"boolean",
        "score":"number"
    }
};

User.Comment = {
    collection: "user_comment",
    key:["user_id","comment_id"],
    schema: {
        "user_id":"number",
        "comment_id":"number",
        "seen":"boolean",
        "follow":"boolean",
        "endorse":"boolean",
        "report":"boolean",
        "score":"number"
    }
};

User.Tag = {
    collection: "user_topic_tags",
    key:["user_id","topic_id"],
    schema: {
        "user_id":"number",
        "topic_id":"number",
        "tag":"string"
    }
};

if (typeof exports !== "undefined") {
    exports.model = function () { return User; };
}