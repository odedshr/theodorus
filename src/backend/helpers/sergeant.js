import { Errors } from 'groundup';

// Sergeant({ tasks }, [ taskOrder, callback ]);
// tasks { [taskName] : { table: db[tableName]
//                        before:function
//                        load:{parameters},
//                        data:{object},
//                        beforeSave:function,
//                        save:{boolean}
//                        after:function,
//                        finally: enum}
// order of operation: before, load, beforeSave, save, after, finally
// finally runs after all tasks completed
// save will use task.data and if not available, will check for repository.data, else will fail
// save's output is the saved value
// before/beforeSaving,after return - true=continue,
//                                    false/undefined/null=skip this task,
//                          error=stop sergeant and return error
// finally = [delete,json ,jsonMap:#indexBy#]

function main(tasks, taskOrder) {
  if (taskOrder === undefined) {
    taskOrder = Object.keys(tasks);
  } else if (typeof taskOrder === 'string') {
    taskOrder = taskOrder.split(',');
  }

  taskOrder.forEach(taskName => {
    if (tasks[taskName] === undefined) {
      throw new Errors.BadInput('task', taskName);
    }
  });

  const output = {};

  return new Promise(resolve => resolve())
    .then(() => handleNextTask(tasks, Array.from(taskOrder).reverse(), output))
    .then(eventually(tasks, Array.from(taskOrder), output))
    .catch(err => { console.trace('Sergeant', err); return err; });
}

function handleNextTask(tasks, taskOrder, output) {
  if (taskOrder.length === 0) {
    return output;
  }

  const taskName = taskOrder.pop(),
    task = tasks[taskName];

  if (task === undefined) {
    throw new Errors.System('task-not-found', [taskName]);
  }

  return prepareDate(task.before, output, tasks, taskName)
    .then(proceed => {
      return proceed && doLoad(output, tasks, taskName)
        .then(() => prepareDate(task.beforeSave, output, tasks, taskName)
          .then(proceed => {
            return proceed && doSave(output, tasks, taskName)
              .then(() => doRemove(tasks, taskName))
              .then(() => prepareDate(task.after, output, tasks, taskName));
          })
        );
    })
    .then (() => handleNextTask(tasks, taskOrder, output));
}

function prepareDate(method, data, tasks, taskName) {
  return new Promise(resolve => resolve())
    .then(() => (!method || method(data, tasks, taskName)))
}

function doLoad(data, tasks, taskName) {
  const task = tasks[taskName];

  return new Promise(resolve => resolve())
    .then(() => {
      switch (typeof task.load) {
        case 'undefined':
          return false;
        case 'string':
          return task.table.get(task.load);
        case 'function':
          return task.load(data, tasks, taskName);
        default:
          if (task.table) {
            return task.table.query(task.load, task.multiple);
          } else {
            throw new Errors.NotFound('table', task);
          }
      }
    })
    .then(result => {
      if (result instanceof Error) {
        throw new Errors.systemError(error, ['load-error', JSON.stringify(tasks[taskName])]);
      }

      data[taskName] = result;
      return true;
    });
}

function doSave(repository, tasks, taskName) {
  const task = tasks[taskName];

  if (task.save === true) {
    if (task.table === undefined) {
      throw new Errors.MissingInput('saveTask.' + taskName + '.table');
    }

    let item = task.data;

    if (item === undefined || item === null) {
      item = repository[taskName];
    }

    if (item === undefined || item === null) {
      throw new Errors.missingInput(JSON.stringify(task));
    }

    const items = Array.isArray(item) ? item : [item];

    return Promise.all(items.map(item => task.table.set(item)));
  }
}

//------------------------------------------------------------------------------------------------------------------//

function doRemove(tasks, taskName) {
  const task = tasks[taskName];

  if (task.save === true && !!task.remove) {
    if (task.table === undefined) {
      throw new Errors.MissingInput('removeTask.' + taskName + '.table');
    }

   let item = task.remove;

   const items = Array.isArray(item) ? item : [items];

   return Promise.all(items.map(item => task.table.set(item)));
  }
}

//------------------------------------------------------------------------------------------------------------------//

function eventually(tasks, tasksOrder, data) {
  tasksOrder.forEach(taskName => {
    const task = tasks[taskName];

    if (task.finally) {
      data[taskName] = task.finally(data, tasks, taskName);
    }
  });

  return data;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function loadFromData(taskToLoadFrom, data, tasks, taskName) {
  data[taskName] = data[taskToLoadFrom];

  return true;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function remove(data, tasks, taskName) {
  delete data[taskName];

  return true;
}

function json(data, tasks, taskName, isMinimal) {
  const item = data[taskName];

  if (item) {
    if (Array.isArray(item)) {
      if (isMinimal === undefined) {
        isMinimal = true;
      }

      data[taskName] = item.map(element => toJSON(element, isMinimal));
    } else {
      data[taskName] = toJSON(item, (isMinimal !== undefined) ? isMinimal : false);
    }
  }

  return true;
}

function minimalJson(data, tasks, taskName) {
  return json(data, tasks, taskName, true);
}

function fullJson(data, tasks, taskName) {
  return json(data, tasks, taskName, false);
}

function toJSON(item, isMinimal = false) {
  if (item === undefined || item === false || item === null) {
    return item;
  } else if (item.toJSON) {
    return item.toJSON(isMinimal);
  } else if (item instanceof Object) {
    return JSON.stringify(item);
  } else {
    return item;
  }
}

/**
 * Convert data[taskName] to a map of its items, indexed by a unique id
 * @param {String} indexBy
 * @param {Map} data
 * @param {Map} tasks
 * @param {String} taskName
 */
function jsonMap(indexBy, data, tasks, taskName) {
  var item,
      jsonItem,
      map = {};

  if (arguments.length === 3) {
    taskName = arguments[2];
    tasks = arguments[1];
    data = arguments[0];
    indexBy = 'id';
  } else if (indexBy === undefined) {
    indexBy = 'id';
  }

  item = data[taskName];

  if (item) {
    forceToArray(item).forEach(element => {
      var key;

      jsonItem  = toJSON(element, true);
      key = jsonItem[indexBy] ? jsonItem[indexBy] : item[indexBy];

      map[key] = jsonItem;
    });

    data[taskName] = map;
  }
}

/**
 * Convert data[taskName] to a map of its items, grouped into arrays by a common key
 * @param {String} groupBy
 * @param {Map} data
 * @param {Map} tasks
 * @param {String} taskName
 */
function jsonGroup(groupBy, data, tasks, taskName) {
  var item = data[taskName],
    map = {};

  if (item) {
    forceToArray(item).forEach(element => {
      let jsonItem  = toJSON(element, true),
        key = jsonItem[groupBy] ? jsonItem[groupBy] : item[groupBy];

      if (map[key] === undefined) {
        map[key] = [];
      }

      map[key].push(jsonItem);
    });

    data[taskName] = map;
  }
}

function forceToArray(element) {
  return (Array.isArray(item) ? item : [item]);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function and(data, tasks, currentTask, conditions) {
  return conditions.every(condition => condition(data, tasks, currentTask));
}

function exists(value) {
  return (value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0));
}

function stopIfNotFound(data, tasks, currentTask) {
  return exists(data[currentTask]) || new Errors.NotFound(currentTask, tasks[currentTask].load);
}

function stopIfFound(data, tasks, currentTask) {
  return !exists(data[currentTask]) || new Errors.AlreadyExists(currentTask, tasks[currentTask].load);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function internalUpdate(source, target) {
  const fields = target.getEditables ? target.getEditables() : Object.keys(target);
  let changes = 0;

  Object.keys(fields).forEach(key => {
    var newValue = source[fields[key]];

    if ((newValue !== undefined) && (newValue !== target[fields[key]])) {
      target[fields[key]] = newValue;
      changes++;
    }
  });

  if (changes > 0) {
    if (target.modified) {
      target.modified = new Date();
    }
  }

  return {
    changeCount: changes,
    subject: target
  };
}

function update(source, target) {
  return internalUpdate(source, target).changeCount;
}

function updateAndSave(source, target, callback) {
  const updateResult = internalUpdate(source, target);

  if (updateResult.changes > 0) {
    return updateResult.subject.save().then(onSaved);
  } else {
    return updateResult.subject.toJSON();
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export {
  main as default,
  //before/beforeSave/after
  stopIfNotFound,
  stopIfFound,
  and,
  //load functions
  loadFromData,
  //finally
  json,
  fullJson,
  minimalJson,
  jsonMap,
  jsonGroup,
  remove,

  update,
  updateAndSave,
};