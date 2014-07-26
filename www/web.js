(function WebApplicationClosure () {
    var config = config || require("../config.json"),
        WebApplicationFactory = WebApplicationFactory || require("./js/WebApplication.js");

    try {
        var instance = WebApplicationFactory.newWebApplication(config);
        instance.run();
    } catch (error) {
        console.error((new Date()) + " | Failed to initialize app\n" + error);
    }
})();