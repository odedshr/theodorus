app = (typeof app !== 'undefined') ? app : {};
(function utilsEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  //==================================/
  this.goToStateRedirect =(function goToStateRedirect () {
    var hash =  (this.state.redirect ? this.state.redirect : '');
    history.pushState({}, hash, location.href.split('#')[0]+'#'+ hash);
    this.register(O.ELM.appContainer);
  }).bind(this);


  this.getPathFromURL = (function getPathFromURL () {
    return location.href.replace(new RegExp('(https?:\\/\\/)|('+location.host+'\\/)','g'),'').split('#')[0].split('?')[0];
  }).bind(this);

  this.extractArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
    var pl   = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^\/:]+):?([^\/]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.hash.substring(1);
    var output = [];
    var match = search.exec(query);
    while (match) {
      var obj = {
        key: decode(match[1]),
        value: decode(match[2])
      };
      output.push(obj);
      match = search.exec(query);
    }

    return output;
  }).bind(this);

  var mapParametersFromSearchQuery = (function mapParametersFromSearchQuery () {
    var pl   = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
      query  = window.location.search.substring(1);
    var urlParams = {};
    var match = search.exec(query);
    while (match ) {
      urlParams[decode(match[1])] = decode(match[2]);
      match = search.exec(query);
    }

    return urlParams;
  });

  var mapArgumentsFromLocationHashInternalDecode = function mapArgumentsFromLocationHashInternalDecode (pl, s) {
    return decodeURIComponent(s.replace(pl, " "));
  };

  var mapArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
    var pl   = /\+/g,  // Regex for replacing addition symbol with a space
      search = /([^\/:]+):?([^\/]*)/g,
      decode = mapArgumentsFromLocationHashInternalDecode.bind(this,pl),
      query  = window.location.hash.substring(1);
    var output = {};
    var match = search.exec(query);
    while (match) {
      output[decode(match[1])] = decode(match[2]);
      match = search.exec(query);
    }

    return output;
  });

  this.getMappedArguments = (function getInputParameters () {
    return this.extend(mapParametersFromSearchQuery(), mapArgumentsFromLocationHash());
  }).bind(this);

  //==================================/

return this;}).call(app);
