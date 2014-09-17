/** @module theodorus.server */
/* server.js is for openshift environment expecting to find the main app in the root and call "server.js" */

(function WebApplicationClosure () {
    var config = config || require("./config.json"),
        WebApplicationFactory = WebApplicationFactory || require("./app/WebApplication.js");

    try {
        var instance = WebApplicationFactory.newWebApplication(config);
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