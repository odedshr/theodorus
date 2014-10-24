/** @module theodorus.models.Topic */
(function TopicClosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
        /** @class theodorus.Topic */
        Topic = AbstractModelLibrary.model({
            autoId: true,

            isSlugValid: function isSlugValid(slug) {
                return (/^[a-zA-Z0-9\-\.%_]{5,140}$/).test(slug);
            },

            incrementStatus: function incrementStatus() {
                var status = this.get("status");
                if (typeof status == "undefined") {
                    throw new Error ("incrementStatus can only run on instances");
                } else {
                    switch (status) {
                        case "idea": status = "discussion"; break;
                        case "discussion": status = "draft"; break;
                        case "draft": status = "proposal"; break;
                        case "proposal": status = "agreement"; break;
                        default: break;
                    }
                    this.set("status",status);
                    return status;
                }
            },

            collection: "topics",
            key: "topic_id",
            schema: {
                "topic_id": { type: "serial", isNullOk: false },
                "user_id": { type: "integer", isNullOk: false, isSecondaryKey: true },
                "slug": { type: "text", size: 20, isSecondaryKey: true, isNullOk: false },
                "created": { type: "date", time: true, isNullOk: false },
                "modified": { type: "date", time: true, isNullOk: false },
                "title": { type: "text", size: 140, isNullOk: false },
                "seen": { type: "integer", defaultValue: 0},
                "follow": { type: "integer", defaultValue: 0},
                "endorse": { type: "integer", defaultValue: 0},
                "report": { type: "integer", defaultValue: 0},
                "opinion": { type: "integer", defaultValue: 0},
                "comment": { type: "integer", defaultValue: 0},
                "votes_required": { type: "integer", defaultValue: 0},
                "status": { type: "enum", values: ["idea", "discussion", "draft", "proposal","agreement", "removed"], defaultValue: "na", isNullOk: true},
                "report_status": { type: "enum", values: ["na", "questioned", "ok", "irrelevant", "offensive", "spam", "violent", "selfcensor"], defaultValue: "idea", isNullOk: true},
                "score": { type: "number", isNullOk: false, isSecondaryKey: true }
            }
        });

    /** @class theodorus.Topic.Read */
    Topic.Read = AbstractModelLibrary.model({
        autoId: false,

        collection: "topic_read",
        key: "topic_id",
        schema: {
            "topic_id": { type: "integer", isNullOk: false },
            "content": { type: "object"}
        }
    });

    /** @class theodorus.Topic.Section */
    Topic.Section = AbstractModelLibrary.model({
        autoId: true,

        collection: "topic_section",
        key: "section_id",
        schema: {
            "section_id": { type: "serial", isNullOk: false },
            "topic_id": { type: "integer", isNullOk: false },
            "before_section_id": { type: "integer", defaultValue: 0 },
            "best_alternative_id": { type: "integer", defaultValue: 0 },
            "opposed": { type: "integer", defaultValue: 0 }
        }
    });

    /** @class theodorus.Topic.Alternative */
    Topic.Alternative = AbstractModelLibrary.model({
        autoId: true,

        collection: "topic_section_alternative",
        key: "alt_id",
        schema: {
            "alt_id": { type: "serial", isNullOk: false },
            "section_id": { type: "integer", isNullOk: false },
            "user_id": { type: "integer", isNullOk: false, key: true, isSecondaryKey: true },
            "created": { type: "date", time: true, isNullOk: false },
            "content": { type: "text" },
            "votes": { type: "integer", defaultValue: 0 }
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