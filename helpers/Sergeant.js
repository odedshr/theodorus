;(function SergeantHelperEnclosure() {
  'use strict';
  var Errors = require('../helpers/Errors.js');

  function LoadError (key, value, message, stack) {
    this.key = key;
    this.value = value;
    this.message = message;
    this.stack = stack;
  }

  LoadError.prototype = Object.create(Error.prototype);
  LoadError.prototype.constructor = LoadError;

  function SaveError (key, value, message, stack) {
    this.key = key;
    this.value = value;
    this.message = message;
    this.stack = stack;
  }

  SaveError.prototype = Object.create(Error.prototype);
  SaveError.prototype.constructor = SaveError;

  //-----------------------------------------------------------------------------------------------------------//

  // Sergeant({ tasks }, [ taskOrder, callback ]);
  // tasks { [taskName] : { table: db[tableName], load:{parameters}, data:{object}, save:{boolean} post:method }
  // pre running after anything else and must return true, false, or error
  // load override data,
  // save=true + load = error
  // save's output is the saved value
  // post running after anything else and must return true, false, or error

  function main (tasks, taskOrder, callback) {
    if (typeof taskOrder === 'string') {
      taskOrder = taskOrder.split(',');
    }
    var count = taskOrder.length;
    while (count--) {
      var task = tasks[taskOrder[count]];
      if ( task === undefined) {
        callback (new LoadError('task',taskOrder[count]));
      } else if ((task.save && task.load) || ! (task.save || task.load || (task.data !== undefined) || task.json)) {
        callback (Errors.badInput(taskOrder[count], task));
      }
    }
    next (tasks, taskOrder.reverse(), {}, callback, callback);
  }

  function next (tasks, taskOrder, output, onSuccess, onError) {
    if (taskOrder.length === 0) {
      onSuccess(output);
      return;
    }
    var taskName = taskOrder.pop();
    var task = tasks[taskName];
    if (task === undefined) {
      onError(Errors.systemError('task-not-found',[taskName]));
    }
    var boundedOnTaskComplete = onTaskCompleted.bind(null, output, tasks, taskName, next.bind(null, tasks, taskOrder, output, onSuccess, onError), onError);

    var beforeTaskResult = task.before ? task.before(output, tasks, taskName) : true;
    if (beforeTaskResult instanceof Error) {
      onError(beforeTaskResult);
    }
    if (beforeTaskResult === undefined) {
      boundedOnTaskComplete(undefined, task.data);
    }
    if (typeof beforeTaskResult === 'object') {
      beforeTaskResult(performMainOperation.bind(null, task, boundedOnTaskComplete),onError);
    } else {
      performMainOperation(task, boundedOnTaskComplete);
    }
  }

   function performMainOperation (task, boundedOnTaskComplete) {
    if ( task.save === true) {
      if (task.data.id && task.data.save) {
        task.data.save(boundedOnTaskComplete);
      } else {
        task.table.create(task.data, boundedOnTaskComplete);
      }
    } else if ( task.load === undefined ) {
      boundedOnTaskComplete(undefined, task.data);
    } else if (isNaN(task.load)) {
      if (task.multiple) {
        task.table.find (task.load, task.multiple, boundedOnTaskComplete);
      } else {
        task.table.one (task.load, boundedOnTaskComplete);
      }
    } else {
      task.table.get(task.load, boundedOnTaskComplete);
    }
  }

  function onTaskCompleted (repository, tasks, currentTaskName, onSuccess, onError, error, item) {
    var task = tasks[currentTaskName];
    var originalValue = repository[currentTaskName];
    if (error && error.literalCode !== 'NOT_FOUND') {
      onError(task.save ? new SaveError(currentTaskName, JSON.stringify(task.data), error) : new LoadError(currentTaskName, JSON.stringify(task.load)));
      return;
    }

    repository[currentTaskName] = item;
    var currentTask = tasks[currentTaskName];
    if (task.json) {
      jsonRepository(repository, (Array.isArray(task.json) && task.json.length===0) ? [currentTaskName] : task.json);
    }
    var afterResult = currentTask.after ? currentTask.after(repository, tasks, currentTaskName) : true;
    if ( afterResult instanceof Error ) {
      onError (afterResult);
      return;
    } else if (afterResult === undefined) {
      repository[currentTaskName] = originalValue;
    }
    if ( typeof afterResult === 'object' ) {
      afterResult(onSuccess, onError);
    } else {
      onSuccess(item);
    }
  }

  function jsonRepository (data, items) {
    var output = {};
    var keys = Object.keys(data);
    // if items is undefined or true, json the entire repository
    if (items === true || items === undefined) {
      items = Object.keys(data);
    }
    while (keys.length) {
      var key = keys.pop();
      if (items.indexOf(key) > -1 ) {
        var source = data[key];
        if (Array.isArray(source)) {
          var count  = source.length;
          output[key] = [];
          while (count--) {
            output[key][count] = jsonItem(source[count], true);
          }
        } else {
          output[key] = jsonItem(source, false);
        }
      }
    }
    return output;
  }

  function jsonItem (item, isMinimal) {
    if (item === undefined || item === false || item === null) {
      return item;
    } else if (item.toJSON) {
      return item.toJSON(isMinimal);
    } else {
      return JSON.stringify(item);
    }
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /* How to use DelayedReturn?

   function syncFunction () {
     var callback = chain.DelayedReturn();
     asyncFunction(callback.input);
     return callback.output;
   }

    function main (onSuccess, onError) {
      var result = syncFunction();
      if (typeof result === 'object') {
        result (onSuccess, onError);
      } else {
        onSuccess (result)
      }
    }

  * */
  function DelayedReturn () {
    var storedResult;
    var gotResult = false;
    var callbackToRunAtTheEnd;

    return {
      input: function (result) {
        storedResult = result;
        gotResult = true;
        if (callbackToRunAtTheEnd) {
          callbackToRunAtTheEnd(storedResult);
        }
      },
      output: function (callback) {
        callbackToRunAtTheEnd = callback;
        if (gotResult) {
          callbackToRunAtTheEnd(storedResult);
        }
      }
    };
  }
  function DelayedReturnWrapper () {
    return new DelayedReturn();
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function stopIfNotFound (data, tasks, currentTask) {
    var value = data[currentTask];
    return (value !== undefined && value !== null) ? true : Errors.notFound(currentTask, tasks[currentTask].load) ;
  }

  function stopIfFound (data, tasks, currentTask) {
    var value = data[currentTask];
    return (value === undefined || value === null) ? true : Errors.alreadyExists(currentTask, tasks[currentTask].load) ;
  }

  function onLoad (itemName, onSuccess, onError, isRequired, error, item) {
    if (error) {
      onError (error.message === "Not found" ? Errors.notFound(itemName) : new LoadError('failed-to-load-'+itemName, error));
    } else if (item || !isRequired) {
      onSuccess (item);
    } else {
      onError (Errors.notFound(itemName));
    }
  }

  function onSaved (callback, err,item) {
    callback (err ? Errors.saveFailed('generic','',err) : item.toJSON());
  }

  function andThenPass (subjectType, callback, err,item) {
    if (err) {
      callback ( Errors.saveFailed(subjectType,'',err));
    } else if (subjectType !== undefined)  {
      var output = {};
      output[subjectType] = item.toJSON();
      callback (output);
    } else {
      callback (item);
    }
  }

  function andThenNothing (err) {
    if (err) {
      console.error ('andThenNothing produced an error:');
      console.error (err);
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function internalUpdate (source, target) {
    var fields = target.getEditables ? target.getEditables() : Object.keys(target);
    var changes = 0;
    var keys = Object.keys(fields);
    while (keys.length) {
      var key = keys.pop();
      var newValue = source[fields[key]];
      if ((newValue !== undefined) && (newValue !== target[fields[key]])) {
        target[fields[key]] = newValue;
        changes++;
      }
    }
    if (changes > 0) {
      if (target.modifed) {
        target.modifed = new Date();
      }
    }
    return {
      changeCount: changes,
      subject: target
    };
  }

  function update (source, target) {
    return internalUpdate(source, target).changeCount;
  }

  function updateAndSave (source, target, callback) {
    var updateResult = internalUpdate(source, target);
    if (updateResult.changes > 0) {
      updateResult.subject.save(onSaved.bind(null, callback));
    } else {
      callback(updateResult.subject.toJSON());
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports = main;
  module.exports.stopIfNotFound = stopIfNotFound;
  module.exports.stopIfFound = stopIfFound;
  module.exports.toJSON = jsonRepository;

  module.exports.onLoad = onLoad;
  module.exports.onSaved = onSaved;
  module.exports.update = update;
  module.exports.updateAndSave = updateAndSave;
  module.exports.andThenNothing = andThenNothing;
  module.exports.andThenPass = andThenPass;
  module.exports.DelayedReturn = DelayedReturnWrapper;
})();