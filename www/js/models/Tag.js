var AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();
    AbstractCollection = (typeof AbstractCollection !== "undefined") ? AbstractCollection : require("./AbstractModel").collection();

var Tag = AbstractModel.extend({
    autoId: false,
    defaults: {
        "count":0,
        "color":"#FFFFFF"
    },

    collection: "tags",
    key:"tag",
    schema: {
        "tag":"string",
        "count":"number",
        "color":"string"
    }
});

///////////////////////////////

var Tags = AbstractCollection.extend({
    name: "tags",
    url: "/tags",
    model: Tag
});

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Tag; };
    exports.collection = function () { return Tags; };
}
