(function WebApplicationClosure () {
    var config = config || require("./config.json"),
        WebApplicationFactory = WebApplicationFactory || require("./app/WebApplication.js");

    /////////////////////////////////////////////////
    // I run on mac and it's painful to define environment variables, so I keep to on an optional file
    try {
        var vars = require("./environment_variables.json");
        for (var key in vars) {
            if (typeof config[key] == "undefined") {
                config[key] = vars[key];
            }
        }
    }
    catch (err) { /* do nothing */ }

    /////////////////////////////////////////////////

    try {
        var instance = WebApplicationFactory.newWebApplication(config,__dirname + "/app");
        instance.run();
    } catch (err) {
        console.error((new Date()) + " | Failed to initialize app");
        if (typeof err === 'object') {
            if (err.message) {
                console.error('\nMessage: ' + err.message);
            }
            if (err.stack) {
                console.error('\nStacktrace:\n====================' );
                console.error(err.stack);
            }
        } else {
            console.error(err);
        }
    }
})();