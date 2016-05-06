app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  this.ifNotError = (function ifNotError (callback, item) {
    if (item instanceof Error) {
      alert (item);
    } else {
      callback(item);
    }
  }).bind(this);

  this.simplyReturn = (function simplyReturn (value) {
    return value;
  }).bind(this);

  this.isProduction = (function isProduction () {
    var url = location.href;
    return (url.indexOf('localhost') === -1) && (url.indexOf('127.0.0.1') === -1);
  })();

//==================================/

  this.clone = function clone (object) {
    return JSON.parse(JSON.stringify(object));
  };

  //==================================/
  this.confirm  = (function confirm (string, callback) {
    callback(window.confirm(string));
  }).bind(this);
  //==================================/

  this.extend = (function extend(obj, src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) {
        obj[key] = src[key];
      }
    }
    return obj;
  }).bind(this);

  //==================================/

return this;}).call(app);
