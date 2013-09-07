var DEFAULT_LANGUAGE = "he";
    //VALID_STATUS  = ["guest","participant","resident","citizen","delegate"];

var User = ((typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model()).extend({
    autoId: true,
    defaults: {
        "score": 0,
        "language": DEFAULT_LANGUAGE
    },

    can: function (permission) {
        var permissions = this.getPrivate("permissions");
        return ((typeof permissions == "undefined") || permissions.indexOf(permission)!=-1);
    },

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
            privateObj = this.get("private"),
            publicObj = this.get("public"),
            xml = this.xmlAttribute("email")+
                  this.xmlAttribute("display_name")+
                  this.xmlAttribute("slug");
        if (privateObj) {
            xml +=  (privateObj.email ? "<email>"+privateObj.email+"</email>" : "")+
                    (privateObj.SN ? "<sn>"+privateObj.SN+"</sn>" : "");
        }
        if (publicObj) {
            xml +=  (publicObj.bio ? "<bio>"+publicObj.bio+"</bio>" : "")+
                    (publicObj.picture ? "<picture>"+publicObj.picture+"</picture>" : "")+
                    (publicObj.birthday ? "<birthday>"+publicObj.birthday+"</birthday>" : "")+
                    (publicObj.language ? "<language>"+publicObj.language+"</language>" : "")+
                    (publicObj.score ? "<score>"+publicObj.score+"</score>" : "");
        }
        return "<user"+(obj.user_id ? ' id="'+obj.user_id+'"' : '')+">" + xml + "</user>";
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
        "badges":"array",
        "bio":"string"
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

if (typeof exports !== "undefined") {
    exports.model = function () { return User; };
}