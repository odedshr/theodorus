(function () {
    var testSuites = require("./testplan.json").include,
        QUnit = require("qunitjs"),
        fileSystem = require("fs"),
        PLUGINS_FOLDER = __dirname.substring(0,__dirname.lastIndexOf("/")) + "/plugins",
        totalTestsCount = 0,
        addTestSuite = function addTestSuite (filePath) {
            try {
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
            }
            catch (err) {
                console.log("failed to add testSuite from "+ filePath + ": " + err);
            }
        },
        runTestsUnits = function runTestSuites () {
            QUnit.load();
            console.log (totalTestsCount +" tests finished");
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
        addTestSuite("./"+testSuite+".js");
    });

    fileSystem.readdir(PLUGINS_FOLDER, function (err, files) {
        if (err) {
            console.error(err);
            runTestsUnits();
        } else {
            var fileCount = files.length;
            files.forEach(function (file) {
                var testFilePath = PLUGINS_FOLDER+"/"+file+"/tests.js";
                fileSystem.exists(testFilePath ,function(exists){
                    if (exists) {
                        addTestSuite("."+testFilePath);
                    }
                    if (!--fileCount) {
                        runTestsUnits();
                    }
                });
            });
        }
    });

})();