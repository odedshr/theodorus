(function () {
    var testSuites = require("./testplan.json").include,
        config = require("../config.json"),
        QUnit = require("qunitjs");


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

    var totalTestsCount = 0;
    for (var s in testSuites) {
        var testSuite = require("./"+testSuites[s]+".js"),
            tests = testSuite.getTests();
        if (tests.length) {
            totalTestsCount += tests.length;
            for (var t in tests) {
                QUnit.test(testSuites[s] + ": "+ tests[t].name, tests[t]);
            }
        }
    }
    QUnit.load();
console.log (totalTestsCount +" tests finished");
})();