(function () {
    var testSuites = require("./testplan.json").include,
        QUnit = require("qunitjs"),
        fileSystem = require("fs"),
        PLUGINS_FOLDER = "./www/plugins",
        totalTestsCount = 0,
        runTestSuite = function testSuite (filePath) {
            var testFile = require(filePath),
                tests = testFile.getTests ? testFile.getTests() : [],
                asyncTests = testFile.getAsyncTests ? testFile.getAsyncTests(QUnit) : [];
            if (tests.length) {
                totalTestsCount += tests.length;
                tests.forEach(function (test){
                    QUnit.test(filePath + ": "+ test.name, test);
                });
            }
            if (asyncTests.length) {
                totalTestsCount += asyncTests.length;
                asyncTests.forEach(function (asyncTest) {
                    QUnit.asyncTest(filePath + ": "+ asyncTest.name, asyncTest);
                });
            }
        };


    QUnit.log(function(details) {
        if (!details.result) {
            var output = "FAILED:\t" + (details.message ? details.message + ", " : "");
            if (details.actual) {
                output += "\n\texpected: " + details.expected + ", actual: " + details.actual;
            }
            if (details.source) {
                output += "\n" + details.source;
            }
            console.log(output);
        }
    });

    testSuites.forEach(function (testSuite) {
        runTestSuite("./"+testSuite+".js");
    });

    fileSystem.readdir(PLUGINS_FOLDER, function (err, files) {
        var fileCount = files.length;
        files.forEach(function (file) {
            var testFilePath = PLUGINS_FOLDER+"/"+file+"/tests.js";
            fileSystem.exists(testFilePath ,function(exists){
                if (exists) {
                    runTestSuite("."+testFilePath);
                }
                if (!--fileCount) {
                    QUnit.load();
                    console.log (totalTestsCount +" tests finished");
                }
            });
        });
    });

})();