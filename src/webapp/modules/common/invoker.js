;(function invokerEnclosure(scope) {
  'use strict';

  // invoke takes a dom element and according to its 'data-register' attribute
  // decide what to do with it - probably replace it with a template, if not load
  // data into it
  scope.invoke = function invoke(domElm) {
    console.log('invoking ' +domElm);
  };

})(theodorus);
