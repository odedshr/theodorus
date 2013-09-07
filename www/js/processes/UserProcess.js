var io = null,
    User = (typeof User !== "undefined") ? User : require("../models/User").model();

var UserProcess = (function () {
    return {
        getUser : function (session,callback) { callback({"error":"method-not-implemented"});},
        getUserTopics: function (session,callback) { callback({"error":"method-not-implemented"});},
        follow: function (session,callback) { callback({"error":"method-not-implemented"});},
        unfollow: function (session,callback) { callback({"error":"method-not-implemented"});}
    };
}());

if (typeof exports !== "undefined") {
    exports.init = function (ioFunctions) {
        io = ioFunctions;
        var methods = []; //I'm using push because of an annoying compiler warning
        methods.push({"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/?$/,"handler":UserProcess.getUser.bind(UserProcess)});
        methods.push({"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/topics\/?$/,"handler":UserProcess.getUserTopics.bind(UserProcess)});
        methods.push({"method":"POST","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":UserProcess.follow.bind(UserProcess)});
        methods.push({"method":"DELETE","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":UserProcess.unfollow.bind(UserProcess)});
        return methods;
    }
}

