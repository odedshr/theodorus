;(function SergeantHelperEnclosure() {
  'use strict';
  var Errors = require('../helpers/Errors.js');
  var tryCatch = require('../helpers/tryCatch.js');

  // Sergeant({ tasks }, [ taskOrder, callback ]);
  // tasks { [taskName] : { table: db[tableName], before:function load:{parameters}, data:{object}, beforeSave:function, save:{boolean} after:function, finally: enum}
  // order of operation: before, load, beforeSave, save, after, finally
  // finally runs after all tasks completed
  // save will use task.data and if not available, will check for repository.data, else will fail
  // save's output is the saved value
  // before/beforeSaving,after return - true=continue, false/undefined/null=skip this task, error=stop sergeant and return error
  // finally = [delete,json ,jsonMap:#indexBy#]

  function main(tasks, taskOrder, callback) {
    if (typeof taskOrder === 'string') {
      taskOrder = taskOrder.split(',');
    }
    for (var i = 0, length = taskOrder.length; i < length; i++) {
      var task = tasks[taskOrder[i]];
      if ( task === undefined) {
        callback (Errors.badInput('task',taskOrder[i]));
      }
    }
    taskOrder = taskOrder.reverse();
    next (tasks, taskOrder, {}, eventually.bind (null, tasks, taskOrder.slice(0), callback), callback);
  }

  function next(tasks, taskOrder, output, onSuccess, onError) {
    if (taskOrder.length === 0) {
      onSuccess(output);
      return;
    }
    var taskName = taskOrder.pop();
    var task = tasks[taskName];
    if (task === undefined) {
      onError(Errors.systemError('task-not-found',[taskName]));
    }
    var boundedNext = next.bind (null, tasks, taskOrder, output, onSuccess, onError );
    var boundedAfter = prepareData.bind (null, task.after, output, tasks, taskName, onError, boundedNext, boundedNext );
    var boundedRemove = doRemove.bind (null, output, tasks, taskName, onError, boundedAfter );
    var boundedSave = doSave.bind (null, output, tasks, taskName, onError, boundedRemove );
    var boundedBeforeSave = prepareData.bind (null, task.beforeSave, output, tasks, taskName, onError, boundedNext, boundedSave );
    var boundedLoad = doLoad.bind (null, output, tasks, taskName, onError, boundedNext, boundedBeforeSave );

    prepareData( task.before, output, tasks, taskName, onError, boundedNext, boundedLoad);
  }

  function prepareData(method, data, tasks, taskName, stop, skip, next) {
    var result = method ? method(data, tasks, taskName) : true;
    if (result instanceof Error) {
      stop(result);
      return;
    }
    if (result === false) {
      skip();
    } else if (typeof result === 'object') {
      result(next,stop);
    } else {
      next();
    }
  }
  function doLoad(data, tasks, taskName, stop, skip, next) {
    tryCatch (function tryCatchDoLoad() {
      var task = tasks[taskName];
      var boundedOnLoaded = onLoaded.bind (null, data,tasks, taskName, stop, next);
      switch (typeof task.load) {
        case 'undefined':
          return next();
        case 'string':
          return task.table.get(task.load, boundedOnLoaded);
        case 'function':
          return task.load(data, tasks, taskName, boundedOnLoaded);
        default:
          if (task.multiple) {
            return task.table.find (task.load, task.multiple, boundedOnLoaded);
          } else {
            return task.table.one (task.load, boundedOnLoaded);
          }
      }
    }, stop);
  }

  function onLoaded(data,tasks, taskName, onError, onSuccess, error, item) {
    if (error && error.literalCode !== 'NOT_FOUND') {
      onError(Errors.systemError(error,['load-error', JSON.stringify(tasks[taskName])]));
    } else {
      data[taskName] = item;
      onSuccess();
    }
  }

  function doSave(repository, tasks, taskName, stop, next) {
    var task = tasks[taskName], item, boundedOnSaved, counter, count;
    if ( task.save === true) {
      if (task.table === undefined) {
        return stop (Errors.systemError('save-task-with-no-table'));
      }
      item = task.data;
      if ( item === undefined || item === null ) {
        item = repository[taskName];
      }
      if ( item === undefined || item === null ) {
        stop(Errors.missingInput(JSON.stringify(task)));
        return;
      }
      if (!Array.isArray((item))) {
        item = [ item ];
      }
      if (item.length === 0) {
        next();
      } else {
        counter = {left: item.length};
        boundedOnSaved = onSaved.bind(null, repository, tasks, taskName, stop, next, counter);
        for (var i = 0, length = item.length; i < length; i++) {
          task.table.set(item[i], boundedOnSaved);
        }
      }
    } else {
      next();
    }
  }

  function onSaved(data, tasks, taskName, onError, onSuccess, counter, error, item) {
    if (error) {
      delete counter.left;
      onError(Errors.systemError (error, ['save-error', JSON.stringify(tasks[taskName])]));
    } else if (counter.left !== undefined){
      data[taskName] = item;
      if (--counter.left === 0) {
        onSuccess();
      }
    }
  }

  //------------------------------------------------------------------------------------------------------------------//

  function doRemove(data, tasks, taskName, stop, next) {
    var task = tasks[taskName], item, boundedOnRemoved, counter;
    if ( task.save === true && !!task.remove) {
      if (task.table === undefined) {
        return stop (Errors.systemError('remove-task-with-no-table'));
      }
      item = task.remove;
      if (!Array.isArray((item))) {
        item = [ item ];
      }
      if (item.length === 0) {
        next();
      } else {
        counter = { left : item.length };
        boundedOnRemoved = onRemoved.bind (null, tasks[taskName], stop,next, counter);
        for (var i = 0, length = item.length; i < length; i++) {
          item[i].remove(boundedOnRemoved);
        }
      }
    } else {
      next();
    }
  }

  function onRemoved (task, onError, onSuccess, counter, error) {
    if (error) {
      delete counter.left;
      onError(Errors.systemError (error, ['remove-error', JSON.stringify(task)]));
    } else if (counter.left !== undefined){
      if (--counter.left === 0) {
        onSuccess();
      }
    }
  }

  //------------------------------------------------------------------------------------------------------------------//

  function eventually (tasks, tasksOrder, callback, data) {
    var runCallback = true;
    for (var i = 0, length = tasksOrder.length; i < length; i++) {
      var taskName = tasksOrder[i];
      var task = tasks[taskName];
      if (task.finally) {
        var result = task.finally(data, tasks, taskName);
        if (result instanceof Error) {
          data[taskName] = result;
        } else if (typeof result === 'object' ) {
          result(callback.bind(null, data));
          callback = result;
          runCallback = false;
        }
      }
    }
    if (runCallback) {
      callback (data);
    }
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function loadFromData (taskToLoadFrom,data, tasks, taskName, callback) {
    callback(undefined, data[taskToLoadFrom]);
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function remove (data, tasks, taskName) {
    delete data[taskName];
    return true;
  }

  function json (data, tasks, taskName, isMinimal) {
    var item = data[taskName];
    if (item) {
      if (Array.isArray(item)) {
        var list = [];
        for (var i = 0, length = item.length; i < length; i++) {
          list.push(toJSON(item[i], (isMinimal !== undefined) ? isMinimal : true));
        }
        data[taskName] = list;
      } else {
        data[taskName] = toJSON(item, (isMinimal !== undefined) ? isMinimal : false);
      }
    }
    return true;
  }
  function minimalJson (data, tasks, taskName) {
    return json (data, tasks, taskName, true);
  }
  function fullJson (data, tasks, taskName) {
    return json (data, tasks, taskName, false);
  }
  function toJSON (item, isMinimal) {
    if (item === undefined || item === false || item === null) {
      return item;
    } else if (item.toJSON) {
      return item.toJSON(isMinimal);
    } else if (item instanceof Object){
      return JSON.stringify(item);
    } else {
      return item;
    }
  }

  function jsonMap (indexBy, data, tasks, taskName) {
    if (arguments.length===3) {
      taskName = arguments[2];
      tasks = arguments[1];
      data = arguments[0];
      indexBy = 'id';
    }
    var item = data[taskName];
    var jsonItem, map = {};
    if (item) {
      if (!Array.isArray(item)) {
        item = [item];
      }
      if (indexBy === undefined) {
        indexBy = 'id';
      }
      for (var i = 0, length = item.length; i < length; i++) {
        jsonItem  = toJSON(item[i], true);
        var key = jsonItem[indexBy] ? jsonItem[indexBy] : item[indexBy];
        map[key] = jsonItem;
      }
      data[taskName] = map;
    }
  }

  function jsonGroup  (groupBy, data, tasks, taskName) {
    var item = data[taskName];
    var jsonItem, map = {};
    if (item) {
      if (!Array.isArray(item)) {
        item = [item];
      }
      for (var i = 0, length = item.length; i < length; i++) {
        jsonItem  = toJSON(item[i], true);
        var key = jsonItem[groupBy] ? jsonItem[groupBy] : item[groupBy];
        if (map[key] === undefined) {
          map[key] = [];
        }
        map[key].push (jsonItem);
      }
      data[taskName] = map;
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

  function internalAnd (conditions, data, tasks, currentTask) {
    var count = conditions.length;
    for (var i = 0; i < count ; i ++ ) {
      var result = conditions[i](data, tasks, currentTask);
      if (result !== true) {
        return result;
      }
    }
    return true;
  }
  function and (/* methods */) {
    return internalAnd.bind(null, Array.prototype.slice.call(arguments));
  }

  function exists (value) {
    return (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0));
  }
  function stopIfNotFound (data, tasks, currentTask) {
    return exists(data[currentTask]) ? true : Errors.notFound(currentTask, tasks[currentTask].load) ;
  }

  function stopIfFound (data, tasks, currentTask) {
    return !exists(data[currentTask]) ? true : Errors.alreadyExists(currentTask, tasks[currentTask].load) ;
  }


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function internalUpdate (source, target) {
    var fields = target.getEditables ? target.getEditables() : Object.keys(target);
    var changes = 0;
    var keys = Object.keys(fields);
    for (var i = 0, length = keys.length; i < length; i++ ) {
      var key = keys[i];
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

  //before/beforeSave/after
  module.exports.stopIfNotFound = stopIfNotFound;
  module.exports.stopIfFound = stopIfFound;
  module.exports.and = and;

  //load functions
  module.exports.loadFromData = loadFromData;

  //finally
  module.exports.json = json;
  module.exports.fullJson = fullJson;
  module.exports.minimalJson = minimalJson;
  module.exports.jsonMap = jsonMap;
  module.exports.jsonGroup = jsonGroup;
  module.exports.remove = remove;

  module.exports.update = update;
  module.exports.updateAndSave = updateAndSave;
  module.exports.DelayedReturn = DelayedReturnWrapper;
})();