app = (typeof app != "undefined") ? app:{};
(function utilsEnclosure() {
    'use strict';
    var rootScope = this;

    this.ifNotError = (function ifNotError (callback, item) {
        if (item instanceof Error) {
            alert (item);
        } else {
            callback(item);
        }
    }).bind(this);

    /*this.extractParametersFromSearchQuery = (function extractParametersFromSearchQuery () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);
        var urlParams = {};
        while (match = search.exec(query)) {
            urlParams[decode(match[1])] = decode(match[2]);
        }

        return urlParams;
    }).bind(this);*/

    this.extractArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^\/:]+):?([^\/]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.hash.substring(1);
        var output = [];
        while (match = search.exec(query)) {
            var obj = {
                key: decode(match[1]),
                value: decode(match[2])
            };
            output.push(obj);
        }

        return output;
    }).bind(this);

    this.mapArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^\/:]+):?([^\/]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.hash.substring(1);
        var output = {};
        while (match = search.exec(query)) {
            output[decode(match[1])] = decode(match[2]);
        }

        return output;
    }).bind(this);

    this.render = (function render (dElm,data) {
        dElm.innerHTML = O.TPL.render(data);
        O.ELM.refresh();
    }).bind(this);

    this.onElementRegistered = (function onElementRegistered (elmId) {
        if (elmId !== undefined && elmId.length) {
            this.registerS(O.ELM.per('#'+elmId+' [data-register]:not(.js-registered)'));
        }
    }).bind(this);

    this.registerS = (function registerS (subElements) {
        var elmCount = subElements.length;
        while (elmCount--) {
            var dElm = subElements[elmCount];
            if (dElm.style.display !== 'none') {
                this.register(dElm);
            }
        }
    }).bind(this);

    this.register = (function register (dElm) {
        if (dElm) {
            var dElmId = dElm.id;
            if (dElmId.length === 0) {
                dElm.setAttribute('id','elm'+parseInt(Math.random()*10000));
                dElmId = dElm.id;
            }
            O.CSS.remove(dElm,'register').add(dElm,'registering');
            var registerCode = dElm.getAttribute('data-register');
            if (registerCode === undefined || registerCode === null || registerCode.length === 0) {
                registerCode = dElmId;
            }
            console.log('will ' + (this.registry[registerCode] ? '': 'not ') + registerCode);
            if (this.registry[registerCode]) {
                this.registry[registerCode](dElm, this.onElementRegistered.bind(this,dElmId));
            } else {
                this.onElementRegistered(dElmId);
            }
            O.CSS.remove(dElm,'registering').add(dElm,'registered');
        }
    }).bind(this);

    this.onWindowResize = (function onWindowResize() {
        this.registerS(O.ELM.per('.js-register'));
    }).bind(this);

    window.onresize = O.EVT.subscribe('window.resize',this.onWindowResize).getDispatcher('window.resize');

return this;}).call(app);