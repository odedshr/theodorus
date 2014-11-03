(function TopicDraftProcessClosure () {
    var io = null,
        Topic = (typeof Topic !== "undefined") ? Topic : require("../models/Topic").model(),
        Comment = (typeof Comment !== "undefined") ? Comment : require("../models/Comment").model(),
        User = (typeof User !== "undefined") ? User : require("../models/User").model(),
        _ = (typeof _ !== "undefined") ? _ : require("underscore");

    var TopicDraftProcess = (function () {
        return {
            init: function (ioFunctions) {
                io = ioFunctions;
                return this.methods;
            },

            getTopicDraft: function (session,callback) {
                var self = this;
                session.useUserAccount(function withUser (user){
                    if (user.can("edit")) {
                        io.db.useTopicIdFromURL(session.url, function withTopicId (topicId){
                            io.db.getTopicDraft(topicId, user.get("user_id"), function(topicDraft){
                                self.sortTopicDraft(topicDraft, function topicDraftSorted (topicDraft) {
                                    self.outputTopicDraft (session,callback, topicId, topicDraft);
                                } );
                            });

                        });
                    } else {
                        callback(session.getPermissionDeniedError());
                    }
                });

            },

            sortTopicDraft : function sortTopicDraft (topicDraft, callback) {
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
                callback (topicDraft);
            },

            outputTopicDraft: function (session,callback,topicId, topicDraft) {
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
                            callback(session.getNotFoundError("topic",topicId));
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
                                    changed = true,
                                    redirectAsOutput = { "directive":"redirect",
                                                         "location":"/topics/"+topicId},
                                    onComplete = function onComplete() {
                                        if (!changed || (--tasks === 0)) {
                                            self.sortTopicDraft (topicDraft,function draftSorted (topicDraft) {
                                                if (changed) {
                                                    self.renderTopicRead (topicId, topicDraft, function TopicReadRendered () {
                                                        callback(redirectAsOutput);
                                                        //self.outputTopicDraft (session, callback, topicId, topicDraft);
                                                    });
                                                } else {
                                                    //self.outputTopicDraft (session, callback, topicId, topicDraft);
                                                    callback(redirectAsOutput);
                                                }
                                            });
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
                                                self.saveAlternative (user, section, content, function (alternative) {
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
                                    changed = false;
                                    onComplete();
                                }
                            });

                        });
                    } else {
                        callback(session.getPermissionDeniedError());
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
                            section.set("best_alternative_id",alternative.get("alt_id"));
                            callback(topicDraft);
                        });

                    } else {
                        callback(topicDraft);
                    }
                });
            },

            renderTopicRead: function renderTopicRead (topicId, topicDraft, callback) {
                var selected = [],
                    topicRead = new Topic.Read({"topic_id": topicId});
                topicDraft.section.forEach(function perSection (section) {
                    var selectedAlt =  section.get("best_alternative_id");
                    if (selectedAlt) {
                        section.get("alternative").forEach(function perAlternative (alternative) {
                            if (alternative.get("alt_id") == selectedAlt) {
                                selected.push (alternative.get("content"));
                            }
                        });
                    }
                });
                topicRead.set("content",selected);
                io.db.save(topicRead, function saved (topicRead) {
                    callback(topicRead);
                });
            }
        };
    }());

    TopicDraftProcess.methods =  [
        {"method":"GET",  "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicDraftProcess.getTopicDraft.bind(TopicDraftProcess)},
        {"method":"POST", "url":/^\/(topics\/\d+|\*[a-zA-Z0-9_-]{3,140})\/edit\/?$/,        "handler":TopicDraftProcess.setTopicDraft.bind(TopicDraftProcess)},
    ];

    if (typeof exports !== "undefined") {
        exports.init = TopicDraftProcess.init.bind(TopicDraftProcess);
    }
})();