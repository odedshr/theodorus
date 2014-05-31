var DEFAULT_LANGUAGE = "he";

var User = ((typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model()).extend({
    autoId: true,
    defaults: {
        "score": 0,
        "language": DEFAULT_LANGUAGE,
        permissions: {}
    },

    can: function (permission) {
        var permissions = this.get("permissions");
        return ((typeof permissions == "undefined") || permissions[permission]);
    },

/*  I might use this data-holders for plug-in information
    data: function (store, key,value) {
        var dataObj = this.get(store);
        if (arguments.length==3) {
            dataObj = dataObj ? dataObj : {};
            dataObj[key]=value;
            return this.set(store,dataObj);
        } else {
            return dataObj ? dataObj[key] : null;
        }
    },

    getPrivate: function (key) {
        return this.data("private",key);
    },

    getPublic: function (key) {
        return this.data("public",key);
    },

    setPrivate: function (key,value) {
        return this.data("private",key,value);
    },

    setPublic: function (key,value) {
        return this.data("public",key,value);
    },

    xml: function () {
        //TODO: add penalties, badges, scores
        var obj = this.toJSON(),
            xml = this.xmlAttribute("email")+
                  this.xmlAttribute("display_name")+
                  this.xmlAttribute("slug")+
                  this.xmlAttribute("SN")+
                  this.xmlAttribute("bio")+
                  this.xmlAttribute("picture")+
                  this.xmlAttribute("birthday")+
                  this.xmlAttribute("language")+
                  this.xmlAttribute("score")+
                  this.xmlAttribute("badges");
        return "<user"+(obj.user_id ? ' id="'+obj.user_id+'"' : '')+">" + xml + "</user>";
    },*/

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
        "email":"string",
        "isEmailVerified":"boolean",
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