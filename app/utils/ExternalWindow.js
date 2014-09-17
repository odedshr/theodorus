var ExternalWindow = (function ExternalWindowClosure() {
    var ExternalWindow = (function () {
        return {
            open : function (url, callback) {
                this.callback = callback;
                this.externalWindow = window.open(url);
                return this.externalWindow;
            },

            callback : function (data) {
                if (this.externalWindow) {
                    this.externalWindow.close();
                    this.externalWindow = null;
                } else {
                    console.error("no this.externalWindow?! how you go here?");
                }
                this.callback(data);
            },

            windowCallback : function (res) {
                if (typeof res.error === "undefined") {
                    if (window.opener) {
                        window.opener.ExternalWindow.callback (res);
                        window.close();
                    } else {
                        location.href = location.href.substr(0, location.href.indexOf("?"));
                    }
                } else {
                    XSLT.transform($("#messages"),{"message":{"@type":"error", "message":error}});
                }
            }
        };
    })();
    return ExternalWindow;
})();


