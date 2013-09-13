var io = null,
    User = (typeof User !== "undefined") ? User : require("../models/User").model(),
    Credentials = (typeof Credentials !== "undefined") ? Credentials : require("../models/Credentials").model();

var TestUnitProcess = (function () {
    var testIo = {
        "config": {
            "mode":"unitTest"
        },
        "db": {
            getCredentials: function (email,callback) { callback(new Credentials({user_id:1, email:email, password:"p4zZW0rD"})); },
            getAccount:function(userId,callback) {
                var user = new User();
                user.set("id",userId);
                callback(user);
            }
        },
        "crypto" : require("crypto"),
        "qs" : require("querystring"),
        "rsa" : require("../RSA"),
        "getScriptListXML": function() { return "<scripts />"}
    };
    var testSession = {
        "useUserId" : function(callback) {
            callback(1);
        },
        "isJSON":true
    };

    return {
        executeTests : function (methods, tests,processName) {
            tests.forEach(function(test) {
                try {
                    var method = methods.filter(function(method) { return (method.url==test.url) && (method.method==test.method)} );
                    if (method.length>0) {
                        method[0].handler(test.session,function (output){
                            test.output = output;
                            if (test.test) {
                                test.result = test.test(output)
                            } else if (test.expectedOutput) {
                                var stringifyIfObject = function (variable) { return (typeof variable == "object") ? JSON.stringify(variable) : variable; };
                                test.result = (stringifyIfObject(test.expectedOutput) == stringifyIfObject (test.output));
                            } else {
                                test.result = "na";
                            }
                        });
                    } else {
                        test.output = "no method found";
                        test.result = false;
                    }
                }
                catch (error) {
                    test.output = error+"";
                    test.result = false;
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

             signUpOK
             signUpEmailInvalid
             signUpPasswordTooShort
             signUpPasswordNotSafe
             signUpPasswordTooWeak
             signUpNotVerified

             signInOK
             signInBadEmail
             signInBadPassword
*/
            var tests = [
                            {"method":"GET",   "name":"signin-get_xml", "url":"/signin", "expectedOutput":"<app><scripts /><signin /></app>"},
                            {"method":"POST",   "name":"signin-no-input","url":"/signin", "expectedOutput":{"error":"bad-credentials"}},
                            {"method":"POST",   "name":"signin-ok","url":"/signin","session":{
                                input: { email:"valid@email.com", password: "p4zZW0rD", md5:"true" },
                                cookie: function() {}
                            }, expectedOutput:{"score":0,"language":"he","id":1}},
                            {"method":"GET",   "name":"get-user-info", "url":"/me","session":testSession, expectedOutput:{"score":0,"language":"he","id":1} }
                        ];


            return this.executeTests(methods, tests, processName);
        },

        testTopicProcess: function () {
            var processName = "TopicProcess";
            var methods = ((typeof TopicProcess !== "undefined") ? TopicProcess : require("../processes/"+processName)).init(testIo);
            /*
             getTopicListNoUser
             getTopicListWIthUser
             addTopicInvalidSlugs
             addTopicSlugNotAvailable
             addTopicUnsafeContent
             */
            var tests = [
                {"method":"GET",   "name":"topics-get-list", "url":"/topics","session":testSession, "test":function () { return true; }},
                {"method":"GET",   "name":"add-topic", "url":"/topic/add","session":testSession, "test":function (output) { return (output.id==1); }}
            ];

            return this.executeTests(methods, tests, processName);
        },

        runTests : function (session,callback) {
            var tests = [];
            tests = tests.concat(this.testAccountProcess());
            tests = tests.concat(this.testTopicProcess());
            if (session.isJSON) {
                callback(tests);
            } else {
                var xml = "";
                var xmlAttribute = function (attributeName, attribute) {
                    return (attribute ? "<"+attributeName+">"+((typeof attribute == "object") ? JSON.stringify(attribute) : (""+attribute)).replace(/</g,"&lt;")+"</"+attributeName+">" : "");
                };
                if (session.isJSON) {
                    callback (tests);
                } else {
                    tests.forEach(function(test) {
                        xml +=  "<test>"+
                            xmlAttribute("process",test.process)+
                            xmlAttribute("name",test.name)+
                            xmlAttribute("method",test.method)+
                            xmlAttribute("url",test.url)+
                            xmlAttribute("input",test.input)+
                            xmlAttribute("expectedOutput",test.expectedOutput)+
                            xmlAttribute("output",test.output)+
                            "\n\t<result>"+(test.result? test.result : "false")+"</result>"+
                            "</test>";
                    });
                    callback("<app mode='"+io.config.mode+"'><testUnits>"+xml+"</testUnits></app>");
                }
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