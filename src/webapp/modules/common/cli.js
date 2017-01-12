;(function cliEnclosure(scope) {
  'use strict';

  scope.cli._add('foo', function test() {
    console.log('good1');
  });

})(theodorus);
