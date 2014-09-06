exports.getTests = function ORMTestSuite () {
    var config = config || require("../config.json"),
        vars = function vars(varName, isRequired) {
            var variable = process.env[varName];
            if (typeof variable === "undefined") {
                variable = config[varName];
                if (typeof variable === "undefined" && isRequired) {
                    throw Error("The required variable "+varName + " was not found. Please fix problem and try again");
                }
            }
            return variable
        },
        db = require("../www/js/db/DbApi.js").init(vars),
        Tag = (typeof Tag !== "undefined") ? Tag : require("../www/plugins/tags/Tag").model();
        //AbstractModel = (typeof AbstractModel !== "undefined") ? AbstractModel : require("../www/js/models/AbstractModel").model();


    return [
        /* function testCount (assert) {
            db.orm([Tag.UserTopicTag], function (db,models) {
               models.user_topic_tags.count({"tag":"בטחון"},function(err,output){
                   console.log(JSON.stringify(output));
               })
            });
        },*/
        function testGet (assert) {
            db.orm([Tag], function (db,models) {
                models.tags.get("בטחון",function(err,output){
                    console.log("err"+JSON.stringify(err))
                    console.log("output"+JSON.stringify(output));
                })
            });
        }
        /*function testORM (assert) {

            db.verifyExistance(Tag, function (){
                //var test = {topic_id : 64}
                db.orm([Tag],function (db,models) {
                    var tag = models.tags.create({"tag": "test", count: "3"}, function created(err) {
                        console.log("saved");
                        models.tags.find({"tag":"test"}, function (err,items){
                            items.forEach(function(item){
                                console.log(JSON.stringify(item));
                                item.remove(function(err){
                                    console.log("item removed" + JSON.stringify(err));
                                })
                            })
                        })
                    });
                });
            });
            assert.ok (true,"just run");
        }*/
    ];
}

/* 1. when plugin start, it should check if all of its table exists
*  2.
* */