(function WebApplicationClosure () {
    var config = config || require("../config.json"),
        WebApplicationFactory = WebApplicationFactory || require("./js/WebApplication.js");

    try {
        var instance = WebApplicationFactory.newWebApplication(config);
        instance.run();
    } catch (err) {
        console.error((new Date()) + " | Failed to initialize app");
        if (typeof err === 'object') {
            if (err.message) {
                console.error('\nMessage: ' + err.message)
            }
            if (err.stack) {
                console.error('\nStacktrace:')
                console.error('====================')
                console.error(err.stack);
            }
        } else {
            console.error(err);
        }
    }
})();