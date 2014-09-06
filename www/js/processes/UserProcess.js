(function UserProcessClosure () {
    var io = null,
        User = (typeof User !== "undefined") ? User : require("../models/User").model(),
        UserProcess = (function () {
        return {
            init: function init (ioFunctions) {
                io = ioFunctions;
                return this.methods;
            },

            getUser : function (session,callback) { callback({"error":"method-not-implemented"}) },
            getUserTopics: function (session,callback) { callback({"error":"method-not-implemented"}) },
            follow: function (session,callback) { callback({"error":"method-not-implemented"}) },
            unfollow: function (session,callback) { callback({"error":"method-not-implemented"}) }
        };
    }())

    UserProcess.methods = [
        {"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/?$/,"handler":UserProcess.getUser.bind(UserProcess)},
        {"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/topics\/?$/,"handler":UserProcess.getUserTopics.bind(UserProcess)},
        {"method":"POST","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":UserProcess.follow.bind(UserProcess)},
        {"method":"DELETE","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":UserProcess.unfollow.bind(UserProcess)},
    ];

    if (typeof exports !== "undefined") {
        exports.init = UserProcess.init.bind(UserProcess);
    }
})();