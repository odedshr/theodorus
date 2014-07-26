var VALID_REPORT_STATUS = ["na","questioned", "ok", "irrelevant","offensive","spam","violent"],
    AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();
    AbstractCollection = (typeof AbstractCollection !== "undefined") ? AbstractCollection : require("./AbstractModel").collection();

var Comment = AbstractModel.extend({
    autoId: true,
    defaults: {
        "endorse":0,
        "follow":0,
        "report":0,
        "report_status":VALID_REPORT_STATUS[0]
    },

    collection: "comments",
    key:"comment_id",
    schema: {
        "topic_id":"number",
        "comment_id":"number",
        "opinion_id":"number",
        "parent_id":"number",
        "user_id":"number",
        "created":"date",
        "content":"string",
        "tags":"array",
        "follow":"number",
        "endorse":"number",
        "report":"number",
        "report_status":"number"
    }
});

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Comment; };
}
