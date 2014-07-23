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

/*


 function getMethodNotImplementedMessage (req,res) {
 res.setHeader('Content-Type', 'application/json' );
 res.end(JSON.stringify({"error":"not-implemented","method":req.method+"/"+req.url}));
 }
 // comments
 app.get(/^\/~[a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage);
 // search
 app.get(/^\/\?[a-zA-Z0-9_-]{1,140}\/?$/, getMethodNotImplementedMessage);
 // errors
 app.get(/^\/![a-zA-Z0-9_-]{3,140}\/?$/, getMethodNotImplementedMessage ); // case "post/error/": // {message, screenshot}


    */