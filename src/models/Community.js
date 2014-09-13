var AbstractModelLibrary = (typeof AbstractModelLibrary !== "undefined") ? AbstractModelLibrary : require("./AbstractModel"),
    Community = AbstractModelLibrary.model({
        autoId: true,

        collection: "communities",
        key:"community_id",
        schema: {
            "community_id":{ type: "serial", isNullOk:false },
            "name":{ type: "text", size: 20,  key: true, isNullOk:false },
            "settings":{ type: "text" }
        }
    });

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Community; };
}
