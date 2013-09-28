var AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();
AbstractCollection = (typeof AbstractCollection !== "undefined") ? AbstractCollection : require("./AbstractModel").collection();

var Notification = AbstractModel.extend({
    xml: function () {
        var response = JSON.parse(this.get("responseText"));
        return '<message type="'+_.keys(response)[0]+'">' +
            "\n\t"+_.values(response)[0]+
            '</message>';
    }
});

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Notification; };
}
