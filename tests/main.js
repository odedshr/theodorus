(function () {
    var testrunner = require("qunit");
    var config = config || require("../config.json");
    config.db_type = "mock";
    console.log(JSON.stringify(config));

})();