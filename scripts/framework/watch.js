//cSpell:words backend
;(function watch() {
  'use strict';

  var chokidar = require('chokidar'),
      tools = require('./build.tools.js'),
      logger = require('../../src/backend/helpers/logger.js');

  function logWatch(verb, method, target) {
    logger(' - ' + target + ' ' + logger.color.yellow + verb + logger.color.reset);
    tools.execAndLogMethod(method.bind({}, target));
  }

  function watch(file, onChange, onAddOrRemove, ignore) {
    logger('Watching ' + file +
                (ignore ? ' (ignoring ' + ignore + ')' : ''));
    chokidar.watch(file, { ignored: ignore, ignoreInitial: true })
      .on('change', logWatch.bind({}, 'changed', onChange))
      .on('add', logWatch.bind({}, 'added', onAddOrRemove))
      .on('unlink', logWatch.bind({}, 'removed', onAddOrRemove));
  }

  function start(watches) {
    watches.forEach(function perWatch(details) {
      watch(details.file,
            details.onChange || details.action,
            details.onAddOrRemove || details.action,
            details.ignore);
    });
  }

  module.exports = {
    start: start,
    watch: watch,
  };
})();
