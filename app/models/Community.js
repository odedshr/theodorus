/** @module theodorus.models.Community */
(function CommunityClosure () {
    var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),

        /** @class theodorus.Community */
        Community = AbstractModelLibrary.model({
            autoId: true,

            collection: "communities",
            key: "community_id",
            schema: {
                "community_id": { type: "serial", isNullOk: false },
                "name": { type: "text", size: 20, key: true, isNullOk: false },
                "settings": { type: "text" }
            }
        });

    ///////////////////////////////
    /** @exports tag */
    if (typeof exports !== "undefined") {
        exports.model = function () {
            return Community;
        };
    }
})();