;(function chainHelperEnclosure() {
    'use strict';
    var Errors = require('../helpers/Errors.js');

    function LoadError (message, stack) {
        this.message = message;
        this.stack = stack;
    }

    LoadError.prototype = Object.create(Error.prototype);
    LoadError.prototype.constructor = LoadError;

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
            if (shouldContinue instanceof Error) {
                onError (shouldContinue);
            } else {
                onSuccess(item);
            }
        }
    }

    function onlyIfExists (repository, tasks, currentTask) {
        return (repository[currentTask.name] !== null) ? true : new Error(currentTask.name+'-not-found') ;
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
        callback (err ? new Error(err) : item.toJSON());
    }

    module.exports = chain;
    module.exports.onlyIfExists = onlyIfExists;
    module.exports.onLoad = onLoad;
    module.exports.onSaved = onSaved;
})();