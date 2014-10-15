(function TopicProcessClosure () {
    var io = null,
        Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
        Comment = (typeof Comment !== "undefined") ? Comment : require("../models/Comment").model(),
        User = (typeof User !== "undefined") ? User : require("../models/User").model(),
        _ = (typeof _ !== "undefined") ? _ : require("underscore"),
        TOPIC_PAGE_SIZE = 0;

    var TopicProcess = (function () {
        return {
            init: function (ioFunctions) {
                io = ioFunctions;
                var topicPageSize = io.config.topic_page_size;
                TOPIC_PAGE_SIZE  = (topicPageSize) ? topicPageSize : TOPIC_PAGE_SIZE;
                return this.methods;
            },

            getTopicCount: function getTopicCount (session,callback) {
                io.db.getTopicCount(function(count){
                    callback({"count":count});
                });
            },

            getAddTopicPage: function getMainPage(session,callback) {
                session.useUserAccount(function(user) {
                    if (user && user.can("suggest")) {
                        callback({
                            "app":{
                                "page": {
                                    "@type":"addTopic"
                                }
                            }
                        });
                    } else {
                        callback(session.getErrorHandler("no-permissions"));
                    }
                });
            },

            getTopics: function (session,callback) {
                session.useUserId(function(userId) {
                    var page = Math.max(1,parseInt(session.url.replace(/\D/g,"")*1)),
                        parameters = {
                            "user" : userId,
                            "pageSize" : TOPIC_PAGE_SIZE,
                            "page": page
                        };

                    io.db.getTopics (parameters,function (topics) {
                        if (topics) {
                            io.db.getTopicCount(function(count){
                                var output = {
                                    "topics": { "topic": topics },
                                    "pageIndex": page,
                                    "pageCount": Math.ceil(count / TOPIC_PAGE_SIZE)
                                };
                                callback(session.isJSON ? output : {
                                    "app":{
                                        "page": _.extend(output, {
                                            "@type":"feed"
                                        })
                                    }
                                });
                            });

                        } else {
                            callback(session.getErrorHandler("error-getting-topics"));
                        }
                    }, page);
                });
            },

            addTopic: function (session,callback) {
               var input = session.input;
                input.slug = encodeURIComponent (input.title.replace(/\s/g,"-").replace(/[()!@#$%^&\*\+=\[\]\{\}`~\';"|\\\/\.]/g,"")).substr(0, io.config.maximum_slug_length);
               if (input.title.length< io.config.minimum_topic_title_length) {
                  callback(session.getErrorHandler("title-too-short","title",input.title));
                } else if (input.title.length> io.config.maximum_topic_title_length) {
                   callback(session.getErrorHandler("title-too-long","title",input.title));
                } else if (!Topic.isSlugValid(input.slug)) {
                   callback(session.getErrorHandler("slug-is-invalid","slug",input.slug));
                } else {
                    io.db.load(Topic,{"slug":input.slug}, function (result) {
                        if (result) {
                            callback(session.getErrorHandler("slug-not-available"));
                        } else {
                            session.useUserId(function(userId) {
                                io.db.getAccount(userId,function (user) {
                                    session.user = user;
                                    if (user && user.can("suggest")) {
                                        //TODO: validate input + saftify!!!
                                        var createDate = (new Date()).toISOString(),
                                            topic = new Topic({
                                                "created": createDate,
                                                "modified":createDate,
                                                "initiator":userId,
                                                "title":input.title,
                                                "slug":input.slug,
                                                "tags":input.tags ? input.tags.split(" ") : []
                                            });
                                        io.db.save(topic,function (result,error){
                                            if (result) {
                                                if (session.isJSON) {
                                                    callback(result.toJSON());
                                                } else {
                                                    callback({  "directive":"redirect",
                                                                "location":"referer"});
                                                }
                                            } else {
                                                callback(session.getErrorHandler(error,"input",input));
                                            }
                                        });
                                    } else {
                                        callback(session.getErrorHandler("no-permission"));
                                    }
                                });
                            });
                         }
                    });
                }
            },

            isExists: function  (session,callback) {
                var url = session.url;
                url = url.replace(/^(http[s]?:\/\/([\da-z\.-]+)(:(\d)*)?)?\/\*/,"");
                url = url.replace(/\/exists\/?$/,"");
                if (Topic.isSlugValid(url)) {
                    io.db.load(Topic,{slug:url},function (found) {
                        if (found) {
                            callback({"result": "slug-exists" });
                        } else {
                            callback({"result": "slug-is-available" });
                        }
                    });
                } else {
                    callback({"result": "slug-is-invalid"});
                }
            },

            getTopic: function (session,callback) {
                io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                    io.db.getTopic(topicId, function (topic){
                        if (topic) {
                            io.db.getTopicRead(topicId, function(topicRead){
                                topic.set("read",topicRead ? topicRead : "");

                                callback(session.isJSON ? topic.toJSON() : {
                                    "app":{
                                        "page": {
                                            "@type":"topicView",
                                            "topic": topic.toJSON()
                                        }
                                    }
                                });
                            });
                        } else {
                            callback(session.get404());
                        }
                    });
                });
            },

            getTopicForRead: function getTopicForRead (session,callback) {
                io.db.useTopicIdFromURL(session.url, function editEithTopicId (topicId) {
                    io.db.getTopicRead(topicId, function (topicRead) {
                        callback(topicRead ? topicRead : "");
                    });
                });
            },

            /*getTopicDraft: function (session,callback) {
                var self = this;
                session.useUserAccount(function withUser (user){
                   if (user.can("edit")) {
                       io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                           io.db.getTopicDraft(topicId, user.get("user_id"), function(topicDraft){
                               self.topicDraftLoaded (session,callback, topicId, topicDraft);
                           });

                       });
                   } else {
                       callback(session.getErrorHandler("no-permissions"));
                   }
                });

            },

            topicDraftLoaded: function (session,callback,topicId, topicDraft) {
                var correctOrder = [];
                topicDraft.section.forEach(function placeInRightPlace(section) {
                    var id = section.get("section_id"),
                        before =section.get("before_section_id"),
                        misplaced = true;

                    for (var i=0;i<correctOrder.length && misplaced;i++) {
                        var compareId = correctOrder[i].get("section_id"),
                            compareBefore = correctOrder[i].get("before_section_id");
                        if (((compareBefore==before) && (compareId>id)) || (before==compareId)) {
                            correctOrder.splice(i,0,section);
                            misplaced=false;
                        }
                    }
                    if (misplaced) {
                        correctOrder.push (section);
                    }
                });
                topicDraft.section = correctOrder;
                if (session.isJSON) {
                    callback (topicDraft);
                } else {
                    io.db.getTopic(topicId, function (topic){
                        if (topic) {
                            topic.set("draft", topicDraft );
                            callback({
                                "app":{
                                    "page": {
                                        "@type":"topicView",
                                        "topic": topic.toJSON()
                                    }
                                }
                            });
                        } else {
                            callback(session.get404());
                        }
                    });
                }
            },

            setTopicDraft: function (session,callback) {
                var input = session.input,
                    self = this;


                session.useUserAccount(function withUser (user){
                    if (user.can("edit")) {
                        io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                            io.db.getTopicDraft(topicId, user.get("user_id"), function(topicDraft){
                                var tasks = 0,
                                    onComplete = function onComplete() {
                                        if (--tasks === 0) {
                                            self.topicDraftLoaded(session, callback, topicId, topicDraft);
                                        }
                                    };

                                topicDraft.section.forEach(function perSection (section) {
                                    var sectionId = section.get("section_id"),
                                        prependedSection = input["prependBefore"+sectionId],
                                        origAltSelected = input["origAltSelected"+sectionId],
                                        selectedAlt = input["selectAlt"+sectionId];
                                                                                                                        // Add prepedning section
                                    if (prependedSection && (prependedSection.length > io.config.minimum_topic_section_length)) {
                                        tasks++;
                                        self.saveSection (user, topicId, topicDraft, prependedSection, sectionId,onComplete);
                                    }

                                    if ((typeof selectedAlt !== "undefined") && (origAltSelected != selectedAlt)){
                                        section.set("user_select",0);
                                        if (selectedAlt=="add") {
                                            var content = input["addAlternative"+sectionId];
                                            if (content  && (content.length > io.config.minimum_topic_section_length)) {
                                                tasks++;
                                                self.saveAlternative (user, section, topicDraft, content, function (alternative) {
                                                    var alts = section.get("alternative") || [];
                                                    alts.push (alternative);
                                                    section.set("alternative",alts);
                                                    onComplete();
                                                });
                                            }
                                        } else {
                                            tasks++;
                                            self.saveUserAlternativeSelection (user, section, new Topic.Alternative({"alt_id":selectedAlt}),function selSaved () {
                                                self.saveSectionGeneralSelection(section, function (output) {
                                                    if (output && output.result == "removed") {
                                                        var sections = topicDraft.section;
                                                        for (var idx = sections.length; idx--;) {
                                                            if (sections[idx].get("section_id")==sectionId) {
                                                                sections.splice(idx,1);
                                                                break;
                                                            }
                                                        }
                                                    }
                                                    onComplete();
                                                });
                                            });
                                        }
                                    }

                                });
                                if (input.appendSection.length > io.config.minimum_topic_section_length) {
                                    tasks++;
                                    self.saveSection (user, topicId, topicDraft, input.appendSection, 0,onComplete);
                                }
                                if (!tasks) {
                                    tasks++;
                                    onComplete();
                                }
                            });

                        });
                    } else {
                        callback(session.getErrorHandler("no-permissions"));
                    }
                });
            },

            saveSectionGeneralSelection: function saveSectionGeneralSelection (section, callback) {
                var topicId = section.get("topic_id"),
                    sectionId = section.get("section_id"),
                    alts = {},
                    redundantSection = true,
                    current = 0;

                io.db.loads(User.TopicDraft, {"where":[{"key":"topic_id","value":topicId}] },function userTopicDraftsLoaded(topicDrafts) {
                    topicDrafts.forEach(function perTopicDraft(topicDraft){
                        var selections = topicDraft.get("selections");
                        if (selections) {
                            var alternativeId = selections[sectionId];
                            if (alternativeId) {
                                redundantSection = redundantSection && ((alternativeId*1) === 0);
                                if (alts[alternativeId]) {
                                    alts[alternativeId]++;
                                } else {
                                    alts[alternativeId] = 1;
                                }
                                if (!alts[current] || alts[alternativeId] > alts[current]) {
                                    current = alternativeId;
                                }
                            }
                        }
                    });
                    if (redundantSection) {
                        io.db.removeSection (section,function () {
                            callback({result:"removed"});
                        });
                    } else {
                        var emptyCallback = function(){};
                        for (var altId in alts) {
                            if (alts[altId] === 0) {
                                io.db.remove(new Topic.Alternative ({alt_id: altId}), emptyCallback );
                            }
                        }
                        section.set("best_alternative_id",current);
                        io.db.save(section, callback);
                    }
                });
            },

            saveUserAlternativeSelection: function saveUserAlternativeSelection (user, section, alternative,callback) {
                var userId = user.get("user_id"),
                    topicId = section.get("topic_id"),
                    sectionId = section.get("section_id"),
                    alternativeId = alternative.get("alt_id");

                section.set("user_select",alternativeId);
                io.db.load(User.TopicDraft,{"user_id":userId, "topic_id":topicId}, function userTopicDraftLoaded (userTopicDraft) {
                    if (!userTopicDraft) {
                        userTopicDraft = new User.TopicDraft({"user_id":userId, "topic_id":topicId});
                    }
                    var selections = userTopicDraft.get("selections");
                    if (!selections) {
                        selections = {};
                    }
                    selections[sectionId] = alternativeId;
                    userTopicDraft.set("selections",selections);
                    io.db.save(userTopicDraft,callback);
                });
            },

            saveAlternative: function saveAlternative (user, section, newContent,callback ) {
                var self = this,
                    userId = user.get("user_id"),
                    sectionId = section.get("section_id");

                io.db.save(new Topic.Alternative({
                    "section_id": sectionId,
                    "user_id": userId,
                    "created": (new Date()).toISOString(),
                    "content": newContent.substr(0,io.config.maximum_topic_section_length),
                    "votes": 1
                }), function savedAlt (alternative) {
                    if (alternative) {
                        self.saveUserAlternativeSelection (user, section, alternative, function userAltSelSaved () {
                            self.saveSectionGeneralSelection (section, function sectionUpdated () {
                                callback(alternative);
                            });
                        });
                    } else {
                        callback(alternative);
                    }
                });
            },

            saveSection: function saveSection (user, topicId, topicDraft, newContent, beforeSectionId, callback) {
                var self = this,
                    section = new Topic.Section({
                        "topic_id": topicId,
                        "before_section_id": beforeSectionId
                    });
                io.db.save(section, function getSectionId (section){
                    if (section) {
                        topicDraft.section.push(section);
                        self.saveAlternative (user, section, newContent, function alternativeSaved (alternative) {
                            section.set("alternative",[alternative]);
                            callback(topicDraft);
                        });

                    } else {
                        callback(topicDraft);
                    }
                });
            },*/

            setUserTopicAttribute :function setUserTopicAttribute (session,callback,attribute,value) {
                io.db.useTopicIdFromURL(session.url, function editEithTopicId (topicId) {
                    session.useUserId(function(userId) {
                        //TODO: check user permissions
                        io.db.getTopic(topicId, function (topic){
                            if (topic) {
                                var topicId = topic.get("topic_id");
                                io.db.setUserTopic(userId,topicId,attribute,value,function (output){
                                    if (!output) {
                                        session.log("failed to save user-topic" +JSON.stringify({"user":userId,"topic":topicId,"attribute":attribute,"value":value}),"error");
                                        callback(session.getErrorHandler("operation-failed"));
                                    } else {
                                        io.db.getTopicStatistics(topicId, function (statistics) {
                                            var value = statistics[attribute];
                                            topic.set(attribute,(value ? value : 0));
                                            //TODO: topic.score on user feedback is calculated real-time
                                            //TODO: update user_topic.score
                                            //TODO: update user.score
                                            io.db.save(topic, function(topicSaveResult){
                                                if (!topicSaveResult.error) {
                                                    if (session.isJSON) {
                                                        callback ({
                                                            "key":attribute,
                                                            "value":(value ? value : 0)
                                                        });
                                                    } else {
                                                        callback({  "directive":"redirect",
                                                            "location":"referer"});
                                                    }
                                                } else {
                                                    callback (topicSaveResult);
                                                }
                                            });
                                        });
                                    }
                                });
                            } else {
                                callback(session.getErrorHandler("topic-not-found"));
                            }
                        });
                    });
                });
            },

            follow: function follow     (session,callback) { this.setUserTopicAttribute(session,callback,"follow",session.url.indexOf("/follow")!=-1); },
            endorse: function endorse   (session,callback)   { this.setUserTopicAttribute(session,callback,"endorse",session.url.indexOf("/endorse")!=-1); },
            report: function report     (session,callback) { this.setUserTopicAttribute(session,callback,"report",session.url.indexOf("/report")!=-1); },

            invite: function invite     (session,callback) { callback({"error":"method-not-implemented"});}, //  case "post/topic/##/invite/[person]": // {invite-message}

            removeTopic: function removeTopic (session, callback) {
                io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                    io.db.getTopic(topicId, function (topic){
                        if (topic) {
                            session.useUserId(function(userId) {
                                if (userId == topic.get("initiator")) {
                                    if (topic.get("endorse") === 0 && topic.get("follow") === 0 && topic.get("comment") === 0) {
                                        topic.set("status","removed");
                                        topic.set("report_status","selfcensor");
                                        io.db.save(topic,function (result,error) {
                                            if (result) {
                                                if (session.isJSON) {
                                                    callback(result.toJSON());
                                                } else {
                                                    callback({  "directive":"redirect",
                                                        "location":"referer"});
                                                }
                                            } else {
                                                session.log("error saving topic" + JSON.stringify(error) +"\n"+JSON.stringify(topic.toJSON()), error);
                                                callback({"error":error});
                                            }
                                        });
                                    } else {
                                        callback(session.getErrorHandler("cannot-remove-item"));
                                    }
                                } else {
                                    session.log("removeTopic: " + userId + " !=" + JSON.stringify(topic.toJSON())+ ","+ topic.get("initiator"),"error");
                                    callback(session.getErrorHandler("cannot-remove-item"));
                                }
                                //callback ({"error":"t"+topic.initiator+"<br/>,u:"+userId});
                            });
                        } else {
                            callback(session.get404());
                        }
                    });
                });
            }
        };
    }());

    TopicProcess.methods =  [
        {"method":"GET",  "url":/^\/(:\d+\/?)?$/,                                           "handler":TopicProcess.getTopics.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/topics\/count\/?$/,                                     "handler":TopicProcess.getTopicCount.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/topics(:\d+)?\/?$/,                                     "handler":TopicProcess.getTopics.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/topics\/add\/?$/,                                       "handler":TopicProcess.getAddTopicPage.bind(TopicProcess)},
        {"method":"POST", "url":/^\/topics\/?$/,                                            "handler":TopicProcess.addTopic.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/\*[a-zA-Z0-9_-]{3,140}\/exists\/?$/,                    "handler":TopicProcess.isExists.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,              "handler":TopicProcess.getTopic.bind(TopicProcess)},
        {"method":"DELETE",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/?$/,           "handler":TopicProcess.removeTopic.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/remove\/?$/,      "handler":TopicProcess.removeTopic.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/read\/?$/,        "handler":TopicProcess.getTopicForRead.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?follow\/?$/,         "handler":TopicProcess.follow.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?endorse\/?$/,        "handler":TopicProcess.endorse.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/(un)?report\/?$/,         "handler":TopicProcess.report.bind(TopicProcess)},
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/invite\/@[a-zA-Z0-9_-]{3,15}\/?$/,    "handler":TopicProcess.invite.bind(TopicProcess)},
    ];

    if (typeof exports !== "undefined") {
        exports.init = TopicProcess.init.bind(TopicProcess);
    }
})();