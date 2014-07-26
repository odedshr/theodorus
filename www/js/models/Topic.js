var VALID_REPORT_STATUS = ["na","questioned", "ok", "irrelevant","offensive","spam","violent","selfcensor"],
    VALID_STATUS  = ["idea", "discussion", "proposition", "decision","removed"],
    AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();
    AbstractCollection = (typeof AbstractCollection !== "undefined") ? AbstractCollection : require("./AbstractModel").collection();

var Topic = AbstractModel.extend({
    autoId: true,
    defaults: {
        "seen":0,
        "tags":{"tag":[]},
        "endorse":0,
        "follow":0,
        "report":0,
        "opinion":0,
        "comment":0,
        "report_status":VALID_REPORT_STATUS[0],
        "status": VALID_STATUS[0],
        "score":0
    },

    extra: function (key,value) {
        var dataObj = this.get("extra");
        if (arguments.length==2) {
            dataObj = dataObj ? dataObj : {};
            dataObj[key]=value;
            return this.set("extra",dataObj);
        } else {
            return dataObj ? dataObj[key] : null;
        }
    },

    collection: "topics",
    key:"topic_id",
    schema: {
        "topic_id":"number",
        "slug":"string",
        "created":"date",
        "modified":"date",
        "initiator":"number",
        "title":"string",
        "tags":"array",
        "seen":"number",
        "follow":"number",
        "endorse":"number",
        "report":"number",
        "opinion":"number",
        "comment":"number",
        "votes_required":"number",
        "status":"number",
        "report_status":"number",
        "score":"number",
        "extra":"object"
    }
});

Topic.isSlugValid = function (slug) {
    return (/^[a-zA-Z0-9\-\.%_]{5,140}$/).test(slug);
};

Topic.Read = AbstractModel.extend({
    collection: "topic_read",
    key:"topic_id",
    schema: {
        "topic_id":"number",
        "content":"string"
    }
});

Topic.Alternative = AbstractModel.extend({
    collection: "topic_write",
    key:"alt_id",
    schema: {
        "alt_id":"number",
        "topic_id":"number",
        "section":"number",
        "content":"string",
        "votes":"number",
        "opposition":"number"
    }
});

///////////////////////////////
/*
var Topics = AbstractCollection.extend({
    name: "topics",
    url: "/topics",
    model: Topic
});*/

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Topic; };
}
