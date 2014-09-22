exports.getAsyncTests = function WeApplicationAsyncTests (QUnit) {
    var config = config || require("../src/config.json"), // required because of the profile_image_folders
        qunit = QUnit,
        assets = {
            vars : function vars(varName, isRequired) {
                var variable = process.env[varName];
                if (typeof variable === "undefined") {
                    variable = config[varName];
                    if (typeof variable === "undefined" && isRequired) {
                        throw Error("The required variable "+varName + " was not found. Please fix problem and try again");
                    }
                }
                return variable;
            },
            xslt : function xslt(jsonObject) {
                return JSON.stringify(jsonObject);
            }
        };

    lib = require ("./../src/app/WebApplication.js");

    return [
        function testRunWebApplication(assert) {
            var duration = false;
            try {
                console.log("==>"+__dirname.substring(0,__dirname.lastIndexOf("/"))+"/src");
                var instance = lib.newWebApplication(config, __dirname.substring(0,__dirname.lastIndexOf("/"))+"/src"),
                    startTimer = new Date(),
                    runnedAndStopped = false;
                instance.run(function () {
                    instance.stop();
                    runnedAndStopped = true;
                });
                while(((new Date() - startTimer) < TIMEOUT) && !runnedAndStopped) {}
                console.log ("webApp-init time: "+ (new Date() - startTimer)/1000 + " seconds" + (runnedAndStopped?"":"(time-out)"));
                return runnedAndStopped;
            } catch (error) {
                console.error((new Date()) + " | Failed to initialize app\n" + error);
            }

            assert.ok(duration,"started and stopped WebApplicationInstance");
            qunit.start();
        }
    ];
};

exports.getTests = function WebApplicationTest () {
    return [];
    /*
        function testWritingToLog() { return false; },
        function testSetupVariables() { return false; },
        function testGetApplicationMode() { return false; },
        function testUsePlugin() { return false; },
        function testXSLT() { return false; },
        function testGetAppAPI() { return false; },
        function testGetHandler() { return false; },
        function testAddHandler() { return false; },
        function testInitProcesses() { return false; },
        function testInitialize() { return false; },
    ];*/
};