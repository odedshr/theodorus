/** @module theodorus.models.Comment */
(function CommentClosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
        /** @class Comment */
        Comment = AbstractModelLibrary.model({
            autoId: true,
            collection: "comments",
            key: "comment_id",
            schema: {
                "comment_id": { type: "serial", isNullOk: false },
                "topic_id": { type: "number", isNullOk: false },
                "parent_id": { type: "number", isNullOk: false },
                "user_id": { type: "number", isNullOk: false },
                "created": { type: "date", time: true, isNullOk: false },
                "content": { type: "text", size: 140, isNullOk: false },
                "follow": { type: "integer", defaultValue: 0},
                "endorse": { type: "integer", defaultValue: 0},
                "report": { type: "integer", defaultValue: 0},
                "report_status": { type: "enum", values: ["na", "questioned", "ok", "irrelevant", "offensive", "spam", "violent"], defaultValue: "na", isNullOk: true}
            }
        });

    ///////////////////////////////
    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.model = function () {
            return Comment;
        };
    }
})();