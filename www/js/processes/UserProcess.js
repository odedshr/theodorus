(function UserProcessClosure () {
    var io = null,
        User = (typeof User !== "undefined") ? User : require("../models/User").model(),
        UserProcess = (function () {
        return {
            init: function init (ioFunctions) {
                io = ioFunctions;
                return this;
            },

            getMethods: function getMethods () { return this.methods; },
            getPlugins: function getPlugins () { return this.plugins; },

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

    UserProcess.plugins = [];
    
    if (typeof exports !== "undefined") {
        exports.init = UserProcess.init.bind(UserProcess);
        exports.methods = UserProcess.getMethods.bind(UserProcess);
        exports.plugins = UserProcess.getPlugins.bind(UserProcess);
    }
})();