(function UserProcessClosure () {
    var io = null,
        User = (typeof User !== "undefined") ? User : require("../models/User").model(),
        UserProcess = (function () {
        return {
            init: function init (ioFunctions) {
                io = ioFunctions;
                return this.methods;
            },

            getUserCount : function getUserCount (session,callback) {
                io.db.getUserCount(function gotCount (count) {
                    callback({"count":count});
                });
            },
            pGetUserCount: function pGetAccount (session, nextHandler, callback) {
                var self = this;
                if (session.isJSON) {
                    nextHandler(session, nextHandler, callback);
                } else {
                    nextHandler(session, nextHandler, function (output) {
                        self.getUserCount(session, function gotUserCount (userCount) {
                            output.app = output.app || {} ;
                            output.app.page = output.app.page || {} ;
                            output.app.page.userCount = userCount.count;
                            callback(output);
                        });
                    });
                }
            },

            getUser : function (session,callback) { callback({"error":"method-not-implemented"}); },
            getUserTopics: function (session,callback) { callback({"error":"method-not-implemented"}); },
            follow: function (session,callback) { callback({"error":"method-not-implemented"}); },
            unfollow: function (session,callback) { callback({"error":"method-not-implemented"}); }
        };
    }());

    UserProcess.methods = [
        {"method":"GET","url": [
            /^\/(:\d+\/?)?$/,
            "/signin",
            "/signup"
        ],"pipe":UserProcess.pGetUserCount.bind(UserProcess)},
        {"method":"GET","url":/user\/count$/,"handler":UserProcess.getUserCount.bind(UserProcess)},
        {"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/?$/,"handler":UserProcess.getUser.bind(UserProcess)},
        {"method":"GET","url":/^\/@[a-zA-Z0-9_-]{3,15}\/topics\/?$/,"handler":UserProcess.getUserTopics.bind(UserProcess)},
        {"method":"POST","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":UserProcess.follow.bind(UserProcess)},
        {"method":"DELETE","url":/^\/@[a-zA-Z0-9_-]{3,15}\/follow\/?$/,"handler":UserProcess.unfollow.bind(UserProcess)},
    ];

    if (typeof exports !== "undefined") {
        exports.init = UserProcess.init.bind(UserProcess);
    }
})();