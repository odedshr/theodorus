////////////////////////////////////////////////////

var Theodorus = _.extend({}, {

    init : function () {
        this.docUrl = document.URL.replace(/^http[s]?:\/\/[a-zA-Z0-9._-]*(:(\d)*)?\//,"");

        $.ajaxSetup({ // all jquery.ajax communications should be json
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });

        switch (this.docUrl.split("/")[0]) {
            case "signout": break;
            case "signin": this.app = new this.user.SigninController (this); break;
            case "signup": this.app = new this.user.SignupController (this); break;
            default:
                if (this.docUrl.substr(0,1)=="*" || this.docUrl.indexOf("topics")==0) {
                    alert ("open topic");
                } else {
                    this.app = new this.feed.FeedController (this);
                    $.get("/me", this.onAccountLoaded);
                }
                break;
        }
        _.bindAll(this,"onAccountLoaded");
    },

    onAccountLoaded : function (accountData) {
        this.currentUser = new User.Account(accountData);
        this.app.render();
    },

    refresh : function () {
        var userXML = "";
        var temp = "guest";
        switch (temp) { //Credentials.user.status
            case "signUp": jQuery.getScript("/core/EditUserDetailsController.js"); break;
            case "active": userXML = User.xml();
            case "guest":
            default:
                transform("#main","<page type=\"mainfeed\">"+userXML+"</page>",function (){
                    var clickButtons = function (event) { return !ExternalWindow.open (event.target.href, function (data) { alert ("I got here " +JSON.stringify(data))} ); };
                    document.getElementById("btn_signin").onclick =clickButtons;
                    document.getElementById("btn_signup").onclick =clickButtons;
                    document.getElementById("btn_signout").onclick = function () {$.delete("/me", function () { alert ("here"); })};
                });
                break;
        }
    },

    me: function () {
        return this.currentUser;
    },

    log : function log() {
        try {
            console.log.apply(console, arguments);
        } catch(e) {
            try {
                opera.postError.apply(opera, arguments);
            } catch(e){
                alert(Array.prototype.join.call( arguments, " "));
            }
        }
    },

    namespace : function (name) {
        if (name) {
            var names = name.split(".");
            var current = this;
            for (var i in names) {
                if (!current[names[i]]) {
                    current[names[i]] = {};
                }
                current = current[names[i]];
            }
        }
        return current;
    }
});

_.bindAll(Theodorus, "refresh","init","namespace", "onAccountLoaded");
$(window).load(Theodorus.init) ;