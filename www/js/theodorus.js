////////////////////////////////////////////////////
(function () {

    var Theodorus = _.extend({},{
        init : function () {
            // loading fonts without js causes 1 sec delay before the text appear. I prefer to have bad font than this delay
            $("body").addClass("loaded-fonts");
            $(".force-web-font-preload").remove();

            var self = this,
                reRender = function reRender () {
                    self.fixTimeReferences();
                    self.colorTags();
                };

            if ((typeof theodorusUIVersion !== "undefined") && (typeof(Storage) !== "undefined") && (theodorusUIVersion != localStorage.getItem("theodorus_version"))) {
                XSLT.preloadXSLT(function () {
                    console.log("all loaded");
                    localStorage.setItem("theodorus_version", theodorusUIVersion);
                    XSLT.useLocalStorage = true;
                    reRender();
                });
            } else {
                reRender();
            }


            /*
            $.ajaxSetup({ // all jquery.ajax communications should be json
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            });
            this.io.refreshFeed = this.io.refreshFeed.bind(this);
            this.io.openPage = this.io.openPage.bind(this);
            this.io.get= this.api.get;
            this.io.ajax= this.api.ajax;
            this.io.post= this.api.post;
            window.addEventListener('popstate', this.parseURL.bind(this), false);
            */
        },

        fixTimeReferences : function fixTimeReferences () {
            // original time tags are set according to server timezone.
            // since they contain the information required, I'll re-process them to set them to browser's timezone
            var timeRefsList = document.getElementsByTagName("time"),
                timeRefs = []; // Will hold the array of Node's
            for(var i = 0, ll = timeRefsList.length; i != ll; timeRefs.push(timeRefsList[i++]));

            timeRefs.forEach(function(ref) {
                XSLT.transform(ref,{"datetime":PrettyDate.render(ref.getAttribute("datetime"))},function(output){});
            });
            //var refs = document.getElementsByTagName("time");
            //alert (refs[0].getAttribute("datetime")+","+refs[0].innerHTML);
        },

        colorTags: function colorTags () {
            var colorDic = {};
            $(".tag:not(.tag-colored)").each(function() {
               var jObj = $(this),
                   text = jObj.children(".tag-label").text();
                if (!colorDic[text]) {
                    var acc = 0;
                    for (var i=0;i<text.length;i++) {
                        acc += text.charCodeAt(i)
                    }
                    colorDic[text] = (acc % 5);
                }
               jObj.addClass("tag-colored").addClass("tag-color-"+colorDic[text]);
            });
        },

        parseURL : function () {
            /*var docURL = document.URL.replace(/^http[s]?:\/\/[a-zA-Z0-9._-]*(:(\d)*)?\//,"");
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
                        this.io.get("/me", this.onAccountLoaded);
                    }
                    break;
            }*/
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

        api:$, // api is the tool-set used to communicate to the server. it includes get, post, put and delete
        io: // io is provided to all controls as a central-point
        {
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
    window.onload = Theodorus.init ;
})();