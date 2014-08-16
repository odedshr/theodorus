exports.getTests = function AccountProcess () {
    var config = config || require("../config.json"), // required because of the profile_image_folders
        User = User || require("../www/js/models/User").model(),
        lib = require ("../www/js/processes/AccountProcess.js"),
        Timer = function (timeout) {
            var start = new Date(),
                TIMEOUT = isNaN(timeout) ? 5000 : timeout,
                isTimeout = function () { return ((new Date()) - this.start < this.TIMEOUT); }
        }

        lib.init({ config: {
            "profile_images_folders" : config.profile_images_folders
        } });
        var functions = lib.methods();
        functionsByMethod = {
                        "GET": [],
                        "POST": [],
                        "PUT": [],
                        "DELETE": []
        },
        getHandler = function findFunction (method, url) {
            var functions = functionsByMethod[method];
            for (var f in functions) {
                var aFunction = functions[f];
                if ((typeof aFunction.url == "string") ? (url == aFunction.url):  aFunction.url.test(url)) {
                    return aFunction.handler;
                }
            }
            console.error("failed to match handler for "+ method+":"+url);
            throw new Error("handler-not-defined");
        }

    for (var f in functions) {
        var aFunction = functions[f];
        functionsByMethod[aFunction.method].push(aFunction);
    }
/*
    methods.push({"method": "GET", "url": "/signin", "handler": AccountProcess.getSignInPage.bind(AccountProcess)});
    methods.push({"method": "POST", "url": "/signin", "handler": AccountProcess.authenticate.bind(AccountProcess)});
    methods.push({"method": "POST", "url": "/user/exists", "handler": AccountProcess.isNameExists.bind(AccountProcess)});
    methods.push({"method": "GET", "url": "/signup", "handler": AccountProcess.getEmailConfirmationPage.bind(AccountProcess)});
    methods.push({"method": "GET", "url": /\/confirm\/[0-9a-zA-Z\.\-_@]+\/[0-9a-zA-Z]+\/?$/, "handler": AccountProcess.getEmailConfirmedPage.bind(AccountProcess)});
    methods.push({"method": "POST", "url": "/signup", "handler": AccountProcess.signUp.bind(AccountProcess)});

    methods.push({"method": "POST", "url": "/profileImage", "handler": AccountProcess.uploadProfileImage.bind(AccountProcess)});
    methods.push({"method": "POST", "url": "/profileImage/approve", "handler": AccountProcess.approveProfileImage.bind(AccountProcess)});
    methods.push({"method": "GET", "url": "/profileImage/remove", "handler": AccountProcess.removeProfileImage.bind(AccountProcess)});
    methods.push({"method": "DELETE", "url": "/profileImage", "handler": AccountProcess.removeProfileImage.bind(AccountProcess)});

    methods.push({"method": "GET", "url": "/resetPassword", "handler": AccountProcess.getResetPasswordPage.bind(AccountProcess)});
    methods.push({"method": "POST", "url": "/resetPassword", "handler": AccountProcess.sendResetPasswordEmail.bind(AccountProcess)});
    methods.push({"method": "GET", "url": /\/resetPassword\/[0-9a-zA-Z\.\-_@]+\/[0-9a-zA-Z]+\/?$/, "handler": AccountProcess.passwordResetConfirmation.bind(AccountProcess)});
    methods.push({"method": "GET", "url": "/password", "handler": AccountProcess.getUpdatePasswordPage.bind(AccountProcess)});
    methods.push({"method": "POST", "url": "/password", "handler": AccountProcess.updatePassword.bind(AccountProcess)});
*/
    var sendEmptyStringToCookie = function sendEmptyStringToCookie (assert, handler) {
        var newStringForCookie = false,
            calledBack = false,
            timer = new Timer(),
            io = {isJSON:true, cookie: function (string) {
                newStringForCookie = string;
            }};

        handler(io, function () {
            calledBack = true;
        });
        while (!calledBack && timer.isTimeout()) {}
        assert.equal (newStringForCookie,"","empty string was sent to cookie");
    },
        testGetProfilePicture = function testGetProfilePicture (assert, user, expectedImage) {
        var handler = getHandler("GET","/profileImage"),
            actualImage = false;
        calledBack = false,
            timer = new Timer(),
            io = {  isJSON:true,
                useUserAccount: function (callback) { callback (user); }
            };

        handler (io, function (result) {
            actualImage = result.location;
            calledBack = true;
        });
        while (!calledBack && timer.isTimeout()) {}
        assert.equal (actualImage,expectedImage,"profile image retrieved as exptected");
    }

    return [
        function testSignOut (assert) {
            sendEmptyStringToCookie ( assert, getHandler("GET","/signout") );
        },

        function testDeleteMe (assert) {
            sendEmptyStringToCookie ( assert, getHandler("DELETE","/me") );
        },

        function testGetMe (assert) {
            var handler = getHandler("GET","/me"),
                actualObject = false;
                calledBack = false,
                timer = new Timer(),
                io = {isJSON:true, useUserAccount: function (callback) {
                    callback (new User());
                }}

            handler(io, function (result) {
                actualObject = result;
                calledBack = true;
            });
            while (!calledBack && timer.isTimeout()) {}
            assert.ok ((typeof actualObject.get("permissions") === "object"),"retrieved object with permissions attribute");
        },

        function testGetAnonymousProfilePicture (assert) {
            testGetProfilePicture(assert, new User(), "/ui/img/anonymous.png");
        },

        function testGetAnonymousProfilePicture (assert) {
            var expectedImage ="pic.png",
                user = new User({"picture":expectedImage});
            testGetProfilePicture(assert, user, "profileImage/"+expectedImage);
        }
    ];
}