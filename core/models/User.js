var DEFAULT_LANGUAGE = "he",
    VALID_STATUS  = ["guest","participant","resident","citizen","delegate"];

var User = ((typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model()).extend({
    autoId: true,
    defaults: {
        "language":  DEFAULT_LANGUAGE,
        "status":     VALID_STATUS[0],
        "permissions": [],
        "badges": [],
        "penalties":[]
    },

    validate: function(attrs, options) {
        if (attrs.status && VALID_STATUS.indexOf(attrs.status)==-1) {
            return "can't end before it starts";
        }
    },

    can: function (permission) {
        return (this.get("permissions").indexOf(permission)!=-1);
    },

    xml: function () {
        //TODO: add penalties, badges, scores
        var obj = this.toJSON();
        return "<user"+(obj.user_id ? ' id="'+obj.user_id+'"' : '')+">" +
            (obj.email ? "<email>"+obj.email+"</email>" : "")+
            (obj.display_name ? "<display_name>"+obj.display_name+"</display_name>" : "")+
            (obj.SN ? "<sn>"+obj.SN+"</sn>" : "")+
            (obj.slug ? "<slug>"+obj.slug+"</slug>" : "")+
            (obj.bio ? "<bio>"+obj.bio+"</bio>" : "")+
            (obj.picture ? "<picture>"+obj.picture+"</picture>" : "")+
            (obj.birthday ? "<birthday>"+obj.birthday+"</birthday>" : "")+
            (obj.language ? "<language>"+obj.language+"</language>" : "")+
            (obj.status ? "<status>"+obj.status+"</status>" : "")+
            (obj.score ? "<score>"+obj.score+"</score>" : "")+
            "</user>";
    },

    collection: "users",
    key:"user_id",
    // this is the public information of the account, that anyone can see
    schema: {
        "user_id":"number",
        "display_name":"string",
        "slug":"string",
        "bio":"string",
        "picture":"string",
        "score":"number",
        "penalties":"array",
        "badges":"array"
    }
});

User.Account = User.extend({
    schema: { // This is all the information
        "user_id":"number",
        "email":"string",
        "display_name":"string",
        "SN":"string",
        "slug":"string",
        "bio":"string",
        "picture":"string",
        "birthday":"string",
        "language":"string",
        "isVerified":"boolean",
        "isModerator":"boolean",
        "isDelegate":"boolean",
        "status":"string",
        "score":"number",
        "penalties":"array",
        "badges":"array",
        "permissions":"array"
    }
});


if (typeof exports !== "undefined") {
    exports.model = function () { return User; };
}