var AbstractModelLibrary = (AbstractModelLibrary || require("../../../app/models/AbstractModel")),
    Tag = AbstractModelLibrary.model({
        autoId: true,
        collection: "tags",
        key: "tag_id",
        schema: {
            tag_id : { type: "serial", isNullOk: false, key:true },
            tag               : { type: "text", size: 20,  isNullOk: false, isSecondaryKey: true },
            topic_id          : { type: "integer", isNullOk: false, isSecondaryKey: true},
            user_id           : { type: "integer", isNullOk: false, isSecondaryKey: true }
        }
    });

Tag.TopicTags  = AbstractModelLibrary.model({
        autoId: false,
        collection: "topic_tags",
        key: "topic_id",
        schema: {
            topic_id       : { type: "serial", isNullOk: false, key:true },
            tags           : { type: "object" }
        }
    });

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Tag; };
}
