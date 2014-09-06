var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
    User = AbstractModelLibrary.model({
        autoId: true,

        collection: "users",
        key:"user_id",
        // this is the public information of the account, that anyone can see
        schema: {
            "user_id":{ type: "serial", isNullOk:false },
            "slug":{ type: "text", size: 20,  isSecondaryKey: true, isNullOk:false },
            "display_name":{ type: "text", size: 20,  isSecondaryKey: true, isNullOk:false },
            "score":{ type: "number", defaultValue: 0},
            "picture":{ type: "text", size: 250 }
        }
    });
User.initialPermissions = {"suggest":true,"feedback":true,"comment":true};
User.Account = AbstractModelLibrary.model({
    autoId: true,

    collection: "users",
    key:"user_id",

    can: function (action) {
        var permissions = this.get("permissions");
        if (typeof permissions == "undefined") {
            permissions = {};
            this.set("permissions",permissions);
        }
        var permission = permissions[action];
        return ((typeof permission != "undefined") && permission);
    },

    schema: {
        "user_id":{ type: "serial", isNullOk:false },
        "slug":{ type: "text", size: 20,  isSecondaryKey: true, isNullOk:false },
        "display_name":{ type: "text", size: 20,  isSecondaryKey: true, isNullOk:false },
        "score":{ type: "number", defaultValue: 0},
        "picture":{ type: "text", size: 250 },
        "permission": { type: "object"}
    }
});


/* attribtues I removed:
    language
    SN
    isSNVerified
    isModerator
    isPolitician
    birthday
    penalties
    permissions
    revoked
    badges
*
* */

User.Topic = AbstractModelLibrary.model({
    collection: "user_topic",
    key:"user_topic_id",
    schema: {
        "user_topic_id": { type: "serial", isNullOk:false },
        "user_id": { type: "number", isNullOk:false, isSecondaryKey:true },
        "topic_id": { type: "number", isNullOk:false, isSecondaryKey:true },
        "seen": { type: "boolean", defaultValue: false},
        "follow": { type: "boolean", defaultValue: false},
        "endorse": { type: "boolean", defaultValue: false},
        "report": { type: "boolean", defaultValue: false},
        "score": { type: "number", defaultValue: 0 }
    }
});

User.Comment = AbstractModelLibrary.model({
    collection: "user_comment",
    key:["user_id","comment_id"],
    schema: {
        "user_id": { type: "number", isNullOk:false },
        "comment_id": { type: "number", isNullOk:false, isSecondaryKey:true },
        "seen":{ type: "boolean", defaultValue: false},
        "follow":{ type: "boolean", defaultValue: false},
        "endorse":{ type: "boolean", defaultValue: false},
        "report":{ type: "boolean", defaultValue: false},
        "score":{ type: "number", defaultValue: 0 }
    }
});


if (typeof exports !== "undefined") {
    exports.model = function () { return User; };
}