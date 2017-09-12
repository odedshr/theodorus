;(function chainHelperEnclosure() {
  'use strict';
  var Errors = require('../helpers/Errors.js');

  function LoadError (message, stack) {
    this.message = message;
    this.stack = stack;
  }

  LoadError.prototype = Object.create(Error.prototype);
  LoadError.prototype.constructor = LoadError;

  function load (tasks, loadOrder, onCompleted, onError) {
    loadNext(tasks, loadOrder.reverse(), {}, onCompleted, onError ? onError : onCompleted);
  }

  function loadNext(tasks, loadOrder, output, onSuccess, onError) {
    if (loadOrder.length) {
      var taskName = loadOrder.pop();
      var task = tasks[taskName];

      if ( task.table !== data ) {
        onceLoaded(output, tasks, taskName, chainNext.bind(null,tasks,output, onSuccess, onError), onError, undefined, task.data);
      } else if (isNaN(task.parameters)) {
        if (task.multiple) {
          task.table.find (task.parameters, task.multiple, onceLoaded.bind(null, output, tasks, taskName, loadNext.bind(null,tasks, loadOrder, output, onSuccess, onError), onError));
        } else {
          task.table.one (task.parameters, onceLoaded.bind(null, output, tasks, taskName, loadNext.bind(null,tasks, loadOrder, output, onSuccess, onError), onError));
        }
      } else {
        task.table.get(task.parameters, onceLoaded.bind(null, output, tasks, taskName, loadNext.bind(null,tasks, loadOrder, output, onSuccess, onError), onError));
      }
    } else {
      onSuccess(output);
    }
  }

  function onceLoaded (repository, tasks, currentTaskName, onSuccess, onError, error, item) {
    if (error) {
      onError (new LoadError('failed-to-load-'+currentTaskName, error));
    } else {
      repository[currentTaskName] = item;
      var currentTask = tasks[currentTaskName];
      var shouldContinue = currentTask.continueIf ? currentTask.continueIf(repository, tasks, currentTaskName) : true;
      if (shouldContinue instanceof Error) {
        onError (shouldContinue);
      } else {
        onSuccess(item);
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // tasks { [taskName] : { table: db[tableName], load:{parameters}, data:{object}, save:{boolean} post:method }
  // pre running after anything else and must return true, false, or error
  // load override data,
  // save=true + load = error
  // save's output is the saved value
  // post running after anything else and must return true, false, or error

  function chain(tasks,onCompleted, onError) {
    chainNext(tasks.reverse(), {}, onCompleted, onError ? onError : onCompleted);
  }

  function chainNext(tasks, output, onSuccess, onError) {
    if (tasks.length) {
      var task = tasks.pop();

      if ( task.table === undefined ) {
        chainOnLoad(output, tasks, task, chainNext.bind(null,tasks,output, onSuccess, onError), onError, undefined, task.data);
      } else if (isNaN(task.parameters)) {
        if (task.multiple) {
          task.table.find (task.parameters, task.multiple, chainOnLoad.bind(null, output, tasks, task, chainNext.bind(null,tasks,output, onSuccess, onError), onError));
        } else {
          task.table.one (task.parameters, chainOnLoad.bind(null, output, tasks, task, chainNext.bind(null,tasks,output, onSuccess, onError), onError));
        }
      } else {
        task.table.get(task.parameters, chainOnLoad.bind(null, output, tasks, task, chainNext.bind(null,tasks,output, onSuccess, onError), onError));
      }
    } else {
      onSuccess(output);
    }
  }

  function chainOnLoad (repository, tasks, currentTask, onSuccess, onError, error, item) {
    if (error) {
      onError (new LoadError('failed-to-load-'+currentTask.name, error));
    } else {
      repository[currentTask.name] = item;
      var shouldContinue = currentTask.continueIf ? currentTask.continueIf(repository, tasks, currentTask) : true;
      if (!shouldContinue || shouldContinue instanceof Error) {
        onError (shouldContinue);
      } else if (shouldContinue === true) {
        onSuccess(item);
      } else if (shouldContinue !== null && typeof shouldContinue === 'object') {
        shouldContinue(onSuccess, onError);
      } else {
        onError (new Error(shouldContinue));
      }
    }
  }

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

  function onlyIfExists (repository, tasks, currentTask) {
    return (repository[currentTask.name] !== null) ? true : Errors.notFound(currentTask.name, JSON.stringify(currentTask.parameters)) ;
  }

  function onlyIfNotExists (repository, tasks, currentTask) {
    return (repository[currentTask.name] === null) ? true : Errors.alreadyExists(currentTask.name, JSON.stringify(currentTask.parameters)) ;
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
    var fields = target.editables;
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
      if (target.modified) {
        target.modified = new Date();
      }
    }
    return {
      changes: changes,
      subject: target
    };
  }

  function update (source, target) {
    return internalUpdate(source, target).subject;
  }

  function updateAndSave (source, target, fields, callback) {
    var updateResult = internalUpdate(source, target);
    if (updateResult.changes > 0) {
      updateResult.subject.save(chain.onSaved.bind(null, callback));
    } else {
      callback(updateResult.subject.toJSON());
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  module.exports = chain;
  module.exports.load = load;
  module.exports.onlyIfExists = onlyIfExists;
  module.exports.onlyIfNotExists = onlyIfNotExists;
  module.exports.onLoad = onLoad;
  module.exports.onSaved = onSaved;
  module.exports.update = update;
  module.exports.updateAndSave = updateAndSave;
  module.exports.andThenNothing = andThenNothing;
  module.exports.andThenPass = andThenPass;
  module.exports.DelayedReturn = DelayedReturnWrapper;
})();