var VALID_REPORT_STATUS = ["na","questioned", "ok", "irrelevant","offensive","spam","violent"],
    VALID_STATUS  = ["idea", "discussion", "proposition", "decision"],
    AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();
    AbstractCollection = (typeof AbstractCollection !== "undefined") ? AbstractCollection : require("./AbstractModel").collection();

var Topic = AbstractModel.extend({
    autoId: true,
    defaults: {
        "report_status":  VALID_REPORT_STATUS[0],
        "status":     VALID_STATUS[0]
    },

    collection: "topics",
    key:"topic_id",
    schema: {
        "topic_id":"number",
        "slug":"string",
        "tags":"array",
        "created":"date",
        "modified":"date",
        "initiator":"number",
        "title":"string",
        "endorsements":"number",
        "follows":"number",
        "status":"string",
        "reports":"string",
        "report_status":"string",
        "score":"number",
        "minimum_votes_required":"number"
    },

    xml: function () {
        //TODO: add penalties, badges, scores
        return '<topic id="'+this.get("topic_id")+'">' +
            this.xmlAttribute("title")+
            this.xmlAttribute("created")+
            this.xmlAttribute("modified")+
            this.xmlAttribute("initiator")+
            "</topic>";
    }
});

Topic.isSlugValid = function (slug) {
    return (/^[a-z0-9\-\._]{5,140}$/).test(slug);
};

Topic.Read = AbstractModel.extend({
    collection: "topic_read",
    key:"topic_id",
    schema: {
        "topic_id":"number",
        "content":"string"
    }
});

Topic.Write = AbstractModel.extend({
    collection: "topic_write",
    key:"topic_id",
    schema: {
        "topic_id":"number",
        "title": "string",
        "content":"string"
    }
});

///////////////////////////////

var Topics = AbstractCollection.extend({
    name: "topics",
    url: "/topics",
    model: Topic
});

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Topic; };
}
