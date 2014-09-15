# DB Api

## A few common notes

###Output and callbacks
All of the following actions return void, but they call callback function with their output.
So when I talk about output, I'll refer to the callback function inputs. For example: the function
```js
count(User,{},function callback (count) {
    console.log (count); // write to console the number of users
})
```

### Model
object definition (or class, if there was one in Javascript) that defines from which table we're going to load,
what its key and its properties.
I'm using [Backbone Model](http://backbonetutorials.com/what-is-a-model/) for the model functionality but adding some
basic information on top of it:
* collection - the name of the relevant table
* key - the name of the primary key
* schema - and object listing all columns and their information (type, size and related keys)
* autoId - informs the save whether the ID is added automatically

### The Where object
It is possible to pass filters to certain objects using an array of objects that have Key, Operator and Value.
The IN operator can accept an array of values. For example:
```js
var where = [
    {key: 'user_id', operator: '=', value:'2'},
    {key: 'color' value: 'IN', value: ['blue','green','red']}
]
```
In following  functions the where array will be noted as 'WhereArray'.

## The functions
### function init (varsGetter, consoleLog)
purpose: initializes the db. missing parameters that isRequired with throw an exception.
input:
* function varsGetter(string varName, boolean isRequired): function that is used to get configuration parameters
* function consoleLog (optional): function to be used for logs (default is console.log)

### function orm (array modelClassArray, function callback)
purpose: define the orm-models and return them and the orm-db api. read more about [ORM](https://www.npmjs.org/package/orm)
input:
* array[Model] modelClassArray: array of models to be defined.
output:
* array ormModelObjects: array of links to the DB for all relevant models.
    Note that the name of each model is according to Model.collection property (i.e. the name of the table in the DB)

### function verifyExistance (model, callback)
purpose: verify a table of model.collection exists if not, creates it using the model.schema
input:
* Model model
output:
* true if successful, Error object when not

### function save (dataObject, callback) {
purpose: saves a dataObject to the DB. Function is used for both UPDATE and ADD and differentiate using the existence of an ID
input:
* modelInstance object to be saved
output:
* Error if failed

### function nullify (dataObject, field, callback) {
purpose: set the value of a specific field to NULL
input:
* modelInstance object to be updated
* string fieldName
output:
* Error if failed

### function count (model, where, callback)
purpose: count the number of items of a model that matches the required filters
input:
* Model model
* WhereArray
output:
* int: return the number of records matching the filters, or false if error

#### function getTopicCount (callback)
count all topics that are not with status=="removed"

### function load (model, itemId, callback)
purpose: loads an item
input:
* Model model
* ? itemId: the unique identifier of the object that most likely be an int or a string. the variable name is determined
            by model.key or customized if itemId is an object. for example itemId = { topic_id:2 }
output
* modelInstance the item


#### function getCredentials (authKey,callback) { exports.load(Credentials, authKey, callback); };
load Credentials

##### function getCredentialsByUserId (userId,callback) { exports.load(Credentials, {"user_id": userId}, callback); };
Credentials by its userId

#### function getUser (userId,callback) { exports.load(User, userId, callback); };
load a User

##### function getUserByName(display_name,callback)
load a user by his/her display name

##### function getAccount(userId,callback) { exports.load(User.Account, userId, callback); };
load User.Account (a User with private properties)

#### function getTopic (topicId,callback) { exports.load(Topic, topicId, callback); };
load a Topic

### function getTopicRead (topicId,callback)
load a TopicRead (The rendered output of a TopicEdit)

### function loads (model, parameters, callback)
purpose: loads items the matches the parameters
input:
* Model model:
* array parameters: the ID of the topic to be loaded
** int pageSize
** int page
** WhereArray
output:
* modelInstances[] - the items

### function useTopicIdFromURL (url, callback)
purpose: extract the topicID from URL. This function is actually a stub in hopes the in the future topics will use slugs
input:
* string URL
output:
* int topicId

### function getTopics (parameters, callback) {
purpose: loads topics that matches parameters. This is similar to loads(Topic) but it uses it an improved SQL statement.
input:
* array parameters: the ID of the topic to be loaded
** int user
** int pageSize
** int page
** WhereArray
output:
* Topic[]

### function setUserTopic (userId, topicId,updateKey,newValue, callback)
purpose: update attribute of user-topic relation, such as "Endorse" or "Report"
input:
* int userId
* int topicId
* string updateKey: possible keys are "seen", "follow", "endorse", "report" and "score"
* ? newValue: apart for score, which is int, all other values are booleans

### function updateTopicCommentCount (topicId, callback) {
purpose: update the comments count of topicId (with an internal calculation)
input:
* int topicId
output:
* Error if failed

### function getTopicStatistics (topicId, callback) {
purpose: get topic statistics
input:
* int topicId
output:
* object:
** int endorse
** int follow
** int report

### function getComments (topicId, userId, callback)
purpose: get topic opinions and comments. Opinion is a type of comment, where there can be only one opinion per topic
per user. Opinions and Comments may contain other comments
input:
* int topicId
* int userId: the userId is used to get the user's opinion on these comments
output:
* Opinion[]
