(function () {
    'use strict';

    var should = require ('should');
    var assert = require ('assert');
    var winston = require ('winston');

    var validators = require ('../helpers/validators.js');

    describe('validators', function () {

        describe('CountWords', function () {
            it('should count words in simple text', function () {
                var text = 'three letter acronym';
                assert.equal(validators.countWords(text),3,'count simple text');
            });
            it('should count words in simple text', function () {
                var text = 'three letter acronym';
                assert.equal(validators.countWords(text),3,'count simple text');
            });
            it('should ignore tags', function () {
                var text = '<b>three</b> letter <br/> acronym';
                assert.equal(validators.countWords(text),3,'should ignore tags');
            });
            it('should split concatenated words', function () {
                var text = 'three-letter-acronym';
                assert.equal(validators.countWords(text),3,'should split concatenated words');
            });
        });

    });
})();