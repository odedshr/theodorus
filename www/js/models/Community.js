var AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();

var Community = AbstractModel.extend({
    autoId: true,

    collection: "communities",
    key:"community_id",
    schema: {
        "community_id":"number",
        "name":"string",
        "settings":"string"
    }
});

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Community; };
}
