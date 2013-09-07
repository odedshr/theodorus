var io = null,
    User = (typeof User !== "undefined") ? User : require("../models/User").model();

var TestUnitProcess = (function () {
    var testIo = {
        "config": {
            "mode":"unitTest"
        },
        "db": {
            "getAccount":function(userId,callback) {
                var user = new User();
                user.set("id",userId);
                callback(user);
            }
        }
    };
    var testSession = {
        "useUserId" : function(callback) {
            callback(1);
        }
    };

    return {
        executeTests : function (methods, tests,processName) {
            tests.forEach(function(test) {
                try {
                    methods.filter(function(method) { return method.url==test.url && method.method==test.method})[0].handler(test.session,function (output){
                        test.output = output;
                        test.result = test.test(output);
                    });
                }
                catch (error) {
                    test.result = error;
                }
                test.process = processName;
            });
            return tests;
        },

        testAccountProcess: function () {
            var processName = "AccountProcess";
            var methods = ((typeof AccountProcess !== "undefined") ? AccountProcess : require("../processes/"+processName)).init(testIo);

            /*methods.push({"method":"GET",   "url":"/signin",        "handler":AccountProcess.getSignInPage.bind(AccountProcess)});
            methods.push({"method":"POST",  "url":"/signin",        "handler":AccountProcess.authenticate.bind(AccountProcess)});
            methods.push({"method":"POST",  "url":"/user/exists",   "handler":AccountProcess.isNameExists.bind(AccountProcess)});
            methods.push({"method":"GET",   "url":"/signup",        "handler":AccountProcess.getSignUpPage.bind(AccountProcess)});
            methods.push({"method":"POST",  "url":"/signup",        "handler":AccountProcess.createCredentials.bind(AccountProcess)});
            methods.push({"method":"GET",   "url":"/signout",       "handler":AccountProcess.getSignOutPage.bind(AccountProcess)});

            methods.push({"method":"GET",   "url":"/me",            "handler":AccountProcess.getAccount.bind(AccountProcess)});
            methods.push({"method":"DELETE","url":"/me",            "handler":AccountProcess.signOut.bind(AccountProcess)});
*/
            var tests = [
                            {"method":"GET",   "url":"/signin","session":testSession, "test":function () { return true; }},
                            {"method":"GET",   "url":"/me","session":testSession, "test":function (output) { return (output.id==1); }}
                        ];


            return this.executeTests(methods, tests, processName);
        },

        runTests : function (session,callback) {
            var tests = [];
            tests = tests.concat(this.testAccountProcess());
            if (session.isJSON) {
                callback(tests);
            } else {
                var xml = "";
                var xmlAttribute = function (attributeName, attribute) {
                    console.log (attributeName+" = "+ attribute + "," + (typeof attribute === "object"));
                    return (attribute ? "<"+attributeName+">"+((typeof attribute === "object") ? JSON.stringify(attribute) : (""+attribute)).replace(/</g,"&lt;")+"</"+attributeName+">" : "");
                };
                tests.forEach(function(test) {
                    xml +=  "<test>"+
                            xmlAttribute("process",test.process)+
                            xmlAttribute("method",test.method)+
                            xmlAttribute("url",test.url)+
                            xmlAttribute("input",test.input)+
                            xmlAttribute("expectedOutput",test.expectedOutput)+
                            xmlAttribute("output",test.output)+
                            xmlAttribute("result",test.result)+
                            "</test>";
                });
                callback("<app mode='"+io.config.mode+"'><testUnits>"+xml+"</testUnits></app>");
            }
        }
    };
}());

if (typeof exports !== "undefined") {
    exports.init = function (ioFunctions) {
        io = ioFunctions;
        var methods = []; //I'm using push because of an annoying compiler warning
        methods.push({"method":"GET","url":/^\/test\/?$/,"handler":TestUnitProcess.runTests.bind(TestUnitProcess)});
        return methods;
    }
}