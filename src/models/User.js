/** @module theodorus.models.User */
(function UserClosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
        /** @class theodorus.User */
        User = AbstractModelLibrary.model({
            autoId: true,

            collection: "users",
            key: "user_id",
            // this is the public information of the account, that anyone can see
            schema: {
                "user_id": { type: "serial", isNullOk: false },
                "slug": { type: "text", size: 20, isSecondaryKey: true, isNullOk: false },
                "display_name": { type: "text", size: 20, isSecondaryKey: true, isNullOk: false },
                "score": { type: "number", defaultValue: 0},
                "picture": { type: "text", size: 250 }
            }
        });
    User.initialPermissions = {"endorse": true, "suggest": true, "feedback": true, "comment": true};
    /** @class theodorus.User.Account */
    User.Account = AbstractModelLibrary.model({
        autoId: true,

        collection: "users",
        key: "user_id",

        can: function (action) {
            var permissions = this.get("permissions");
            if (typeof permissions == "undefined") {
                permissions = {};
                this.set("permissions", permissions);
            }
            var permission = permissions[action];
            return ((typeof permission != "undefined") && permission);
        },

        schema: {
            "user_id": { type: "serial", isNullOk: false },
            "slug": { type: "text", size: 20, isSecondaryKey: true, isNullOk: false },
            "display_name": { type: "text", size: 20, isSecondaryKey: true, isNullOk: false },
            "score": { type: "number", defaultValue: 0},
            "picture": { type: "text", size: 250 },
            "permissions": { type: "object"}
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
    /** @class theodorus.User.Topic */
    User.Topic = AbstractModelLibrary.model({
        autoId: true,
        collection: "user_topic",
        key: "user_topic_id",
        schema: {
            "user_id": { type: "number", isNullOk: false, isSecondaryKey: true },
            "topic_id": { type: "number", isNullOk: false, isSecondaryKey: true },
            "seen": { type: "boolean", defaultValue: false},
            "follow": { type: "boolean", defaultValue: false},
            "endorse": { type: "boolean", defaultValue: false},
            "report": { type: "boolean", defaultValue: false},
            "vote": { type: "enum", values: ["na", "yes", "no", "refrain"], defaultValue: "na" },
            "votes_required": { type: "integer", defaultValue: 0 },
            "yes_votes_required": { type: "integer", defaultValue: 0 },
            "score": { type: "number", defaultValue: 0 }
        }
    });

    User.TopicDraft = AbstractModelLibrary.model({
        collection: "user_topic_draft",
        key: ["user_id", "topic_id"],
        schema: {
            "user_id": { type: "number", isNullOk: false, isSecondaryKey: true },
            "topic_id": { type: "number", isNullOk: false, isSecondaryKey: true },
            "selections": { type: "object" }
        }
    });

    /** @class theodorus.User.Comment */
    User.Comment = AbstractModelLibrary.model({
        collection: "user_comment",
        key: ["user_id", "comment_id"],
        schema: {
            "user_id": { type: "number", isNullOk: false },
            "comment_id": { type: "number", isNullOk: false, isSecondaryKey: true },
            "seen": { type: "boolean", defaultValue: false},
            "follow": { type: "boolean", defaultValue: false},
            "endorse": { type: "boolean", defaultValue: false},
            "report": { type: "boolean", defaultValue: false}
        }
    });

    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.model = function () {
            return User;
        };
    }
})();