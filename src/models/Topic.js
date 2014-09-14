/** @module theodorus.models.Topic */
(function TopicClosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
        /** @class theodorus.Topic */
        Topic = AbstractModelLibrary.model({
            autoId: true,

            isSlugValid: function isSlugValid(slug) {
                return (/^[a-zA-Z0-9\-\.%_]{5,140}$/).test(slug);
            },

            collection: "topics",
            key: "topic_id",
            schema: {
                "topic_id": { type: "serial", isNullOk: false },
                "slug": { type: "text", size: 20, isSecondaryKey: true, isNullOk: false },
                "created": { type: "date", time: true, isNullOk: false },
                "modified": { type: "date", time: true, isNullOk: false },
                "initiator": { type: "integer", isNullOk: false, isSecondaryKey: true },
                "title": { type: "text", size: 140, isNullOk: false },
                "seen": { type: "integer", defaultValue: 0},
                "follow": { type: "integer", defaultValue: 0},
                "endorse": { type: "integer", defaultValue: 0},
                "report": { type: "integer", defaultValue: 0},
                "opinion": { type: "integer", defaultValue: 0},
                "comment": { type: "integer", defaultValue: 0},
                "votes_required": { type: "integer", defaultValue: 0},
                "status": { type: "enum", values: ["na", "questioned", "ok", "irrelevant", "offensive", "spam", "violent", "selfcensor"], defaultValue: "na", isNullOk: true},
                "report_status": { type: "enum", values: ["idea", "discussion", "proposition", "decision", "removed"], defaultValue: "idea", isNullOk: true},
                "score": { type: "number", isNullOk: false, isSecondaryKey: true }
            }
        });

    /** @class theodorus.Topic.Read */
    Topic.Read = AbstractModelLibrary.model({
        collection: "topic_read",
        key: "topic_id",
        schema: {
            "topic_id": { type: "integer", isNullOk: false },
            "content": { type: "text"}
        }
    });

    /** @class theodorus.Topic.Alternative */
    Topic.Alternative = AbstractModelLibrary.model({
        collection: "topic_write",
        key: "alt_id",
        schema: {
            "alt_id": { type: "serial", isNullOk: false },
            "topic_id": { type: "integer", isNullOk: false },
            "created": { type: "date", time: true, isNullOk: false },
            "author": { type: "integer", isNullOk: false, key: true, isSecondaryKey: true },
            "section": { type: "integer" },
            "content": { type: "text" },
            "votes": { type: "integer", defaultValue: 0 },
            "opposition": { type: "integer", defaultValue: 0 }
        }
    });

    ///////////////////////////////
    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.model = function () {
            return Topic;
        };
    }
})();