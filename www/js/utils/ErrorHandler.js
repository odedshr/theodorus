window.onError = (function() { return function (message, url, linenumber) {
    console.error("JavaScript error: " + message + " on line " + linenumber + " for " + url);
}; })();