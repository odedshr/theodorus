var io = null,
    Tag = (typeof Tag !== "undefined") ? Tag : require("../models/Tag").model(),
    _ = (typeof _ !== "undefined") ? _ : require("underscore");

var TagProcess = (function () {
    return {
        getTags: function (session,callback) {
            io.db.getTags (function (items) {
                if (items) {
                    callback(items);
                } else {
                    callback({"error":"error-getting-tags"});
                }
            });
        }
    };
}());

if (typeof exports !== "undefined") {
    exports.init = function (ioFunctions) {
        io = ioFunctions;
        return [
            {"method":"GET",  "url":/^\/tags\/?$/,  "handler":TagProcess.getTags.bind(TagProcess)}
        ]
    }
}
// tags actions
//app.get("/tags", getMethodNotImplementedMessage);
//app.get("/tags/dictionary", getMethodNotImplementedMessage);
// get items by tag
//app.get(/^\/#[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
