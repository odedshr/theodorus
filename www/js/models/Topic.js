var VALID_REPORT_STATUS = ["na","questioned", "ok", "irrelevant","offensive","spam","violent"],
    VALID_STATUS  = ["idea", "discussion", "proposition", "decision"],
    AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("./AbstractModel").model();
    AbstractCollection = (typeof AbstractCollection !== "undefined") ? AbstractCollection : require("./AbstractModel").collection();

var Topic = AbstractModel.extend({
    autoId: true,
    defaults: {
        "seen":0,
        "tags":[],
        "endorse":0,
        "follow":0,
        "report":0,
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
        "comment":"number",
        "votes_required":"number",
        "status":"number",
        "report_status":"number",
        "score":"number",
        "extra":"object"
    },
/* extra objects:
 delimiter $$
 user_endorse
 user_follow
 user_report
 */
    xml: function () {
        var This = this,
            statAttribute = function (attribute) {
                var value = This.get(attribute);
                var user_value = This.get("user_"+attribute);
                return (value>0) ? ("<"+attribute+" me='"+(user_value?"true":"false")+"'>"+(value?value:0)+"</"+attribute+">") : "";
            },
            url = this.get("slug");
        return '<topic id="'+this.get("topic_id")+'">' +
            "\n\t"+this.xmlAttribute("title")+
            "\n\t"+this.xmlAttribute("created")+
            "\n\t"+this.xmlAttribute("modified")+
            "\n\t"+"<url>"+(((typeof url == "string") && url.length>0) ? "*"+url : "/topics/"+this.get("topic_id")) + "</url>"+
            "\n\t"+this.xmlAttribute("slug")+
            "\n\t"+this.xmlAttribute("initiator")+
            "\n\t"+this.xmlAttribute("status")+
            "\n\t"+this.xmlAttribute("report_status")+
            "\n\t"+this.xmlAttribute("score")+
            "\n\t"+this.xmlAttribute("extra")+
            "\n\t"+this.xmlAttribute("comment")+
            "\n\t"+statAttribute("seen")+
            "\n\t"+statAttribute("follow")+
            "\n\t"+statAttribute("endorse")+
            "\n\t"+statAttribute("report")+
        '</topic>';
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

var Topics = AbstractCollection.extend({
    name: "topics",
    url: "/topics",
    model: Topic
});

///////////////////////////////
if (typeof exports !== "undefined") {
    exports.model = function () { return Topic; };
}
