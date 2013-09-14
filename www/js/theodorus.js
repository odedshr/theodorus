////////////////////////////////////////////////////

var Theodorus = _.extend({}, {
    init : function () {
        $.ajaxSetup({ // all jquery.ajax communications should be json
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
        this.io.refreshFeed = this.io.refreshFeed.bind(this);
        this.io.openPage = this.io.openPage.bind(this);

        window.addEventListener('popstate', this.parseURL.bind(this), false);
    },

    parseURL : function () {
        var docURL = document.URL.replace(/^http[s]?:\/\/[a-zA-Z0-9._-]*(:(\d)*)?\//,"");
        this.io.docURL = docURL;
        switch (docURL.split("/")[0]) {
            case "test": break;
            case "signout": break;
            case "signin": this.app = new this.user.SigninController (this.io); break;
            case "signup": this.app = new this.user.SignupController (this.io); break;
            default:
                if (docURL.substr(0,1)=="*" || docURL.indexOf("topics")==0) {
                    this.app = new this.topic.TopicController (this.io);
                } else {
                    this.app = new this.feed.FeedController (this.io);
                }
                if (this.io.user) {
                    this.app.render();
                } else {
                    $.get("/me", this.onAccountLoaded);
                }
                break;
        }
    },

    onAccountLoaded : function (accountData) {
        this.io.user = new User.Account(accountData);
        this.app.render();
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

    /*
        ClientController is the API from any controller back to the here, thus creating io-center.
     */
    io: {
      docURL:null,

      refreshFeed: function () {
          if (this.app.reload) {
              this.app.reload();
          }
      },
      openPage: function (url, title, callback) {
          window.history.pushState({"state":url}, event.target.innerHTML, url);
          this.parseURL();
          if (callback) {
              callback()
          }
      },
      notify: function(type,message) {
          switch(type) {
              case "notify":
                  console.log(type+":"+message);
                  break;
              case "error":
              case "info":
                  if (typeof message=="undefined") {
                      $("#messages").html("");
                  } else {
                      transform("#messages","<message type='"+type+"' message='"+message+"' />");
                  }
                  break;
              case "announcement":
              case "critical":
                  alert (type+":" +message);
                  break;
          }
      },
      user: null
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

_.bindAll(Theodorus, "init","namespace", "onAccountLoaded","parseURL");
$(window).load(Theodorus.init) ;