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

    //try {
        var totalTestsCount = 0,
            failedTestCount = 0;
        for (var s in testSuites) {
            var testSuite = require("./"+testSuites[s]+".js"),
                tests = testSuite.getTests();
            //    printableSuiteNumber = (s*1)+1;
            if (tests.length) {
                totalTestsCount += tests.length;
                //if (s>0) { console.log("=========================================="); }
                //console.log(printableSuiteNumber+".\t"+testSuite.getTests.name);
                for (var t in tests) {
                    QUnit.test(testSuites[s] + ": "+ tests[t].name, tests[t]);

                    //if (t>0) { console.log("-------------------------------------------"); }
                    //console.log(printableSuiteNumber+"."+((t*1)+1)+".\t"+tests[t].name);
                    //var result = tests[t]();
                    //if (!result) {
                    //    failedTestCount++;
                    //}
                    //console.log("\t>> " + (typeof result != "undefined" ? JSON.stringify(result): "no results"));
                }
            }
            //else {
            //    console.log(printableSuiteNumber+".\t"+testSuite.getTests.name + " test suite is empty");
            //}

        }
    //} catch (e) {
    //    console.log ("got exception: " + e +((typeof e === "object") ? "\n"+JSON.stringify(e): ""));
    //}
    QUnit.load();
console.log (totalTestsCount +" tests finished");
})();