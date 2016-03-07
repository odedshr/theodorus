;(function loggerEnclosure() {
    'use strict';

    function logger (string, level) {
        if (string instanceof Error ) {
            var stack = '';
            if (typeof string.stack.replace === 'function') {
                stack = '\n'+ JSON.stringify(string.replace(/^[^\(]+?[\n$]/gm, '')
                    .replace (/^\s+at\s+/gm, '')
                    .replace (/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                    .split ('\n'),null,4);
            } else {
                var ptr = string;
                while (ptr.stack) {
                    if (ptr.stack.message) {
                        stack = stack.concat ('\n'+ptr.stack.message);
                    }
                    ptr = ptr.stack;
                }
            }
            console.error ((level === undefined ? '': (level + ': ')) + string.message + ':' + stack);
        } else {
            console.log ((level === undefined ? '': (level + ': ')) + string);
        }
    }

    module.exports = logger;
})();