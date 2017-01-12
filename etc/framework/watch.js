;(function watch() {
  var chokidar = require('chokidar');

  var tools = require('./build.tools.js');
  var color = require('./console-colour.js');

  function logWatch(verb, method, target) {
    console.log(' - ' + target + ' ' + color.yellow + verb + color.reset);
    tools.execAndLogMethod(method.bind({}, target));
  }

  function watch(file, onChange, onAddOrRemove, ignore) {
    console.log(' now watching ' + file +
                (ignore ? ' (ignoring ' + ignore + ')' : ''));
    chokidar.watch(file, {ignored: ignore, ignoreInitial: true})
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
