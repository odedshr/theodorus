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
    },

    xml: function () {
        return "<tag count='"+this.get("count")+"' color='"+this.get("color")+"'>"+this.get("tag")+"</tag>";
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
}
