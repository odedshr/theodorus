app = (typeof app != "undefined") ? app:{};
(function utilsEnclosure() {
    'use strict';

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

    this.logType = {
        'debug': 'debug',
        'system': 'system',
        'community': 'community',
        'message': 'message',
        'score': 'score',
        'error': 'error'
    };
    this.log = (function log (value, type, color) {
        if (type=== undefined) {
            type = this.logType.system;
        }
        if (type !== this.logType.debug || !this.isProduction) {
            if (color === undefined) {
                console.log(type+': '+ value);
            } else {
                console.log(type+': '+ value, color);
            }
        }
        return value;
    }).bind(this);

    //==================================/

    this.extend = (function extend(obj, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) obj[key] = src[key];
        }
        return obj;
    }).bind(this);

    //==================================/
    this.goToStateRedirect =(function goToStateRedirect () {
        location.href = location.href.split('#')[0] + (this.state.redirect ? this.state.redirect : '');
    }).bind(this);


    this.getPathFromURL = (function getPathFromURL () {
        return location.href.replace(new RegExp('(https?:\\/\\/)|('+location.host+'\\/)','g'),'').split('#')[0].split('?')[0];
    }).bind(this);

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

    var mapParametersFromSearchQuery = (function mapParametersFromSearchQuery () {
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
    });

    var mapArgumentsFromLocationHashInternalDecode = function mapArgumentsFromLocationHashInternalDecode (pl, s) {
        return decodeURIComponent(s.replace(pl, " "));
    };

    var mapArgumentsFromLocationHash = (function extractArgumentsFromLocationHash () {
        var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^\/:]+):?([^\/]*)/g,
            decode = mapArgumentsFromLocationHashInternalDecode.bind(this,pl),
            query  = window.location.hash.substring(1);
        var output = {};
        while (match = search.exec(query)) {
            output[decode(match[1])] = decode(match[2]);
        }

        return output;
    });

    this.getMappedArguments = (function getInputParameters () {
        return this.extend(mapParametersFromSearchQuery(), mapArgumentsFromLocationHash());
    }).bind(this);

    //==================================/
    this.render = (function render (dElm,data) {
        try {
            dElm.innerHTML = O.TPL.render(data);
            O.ELM.refresh();
        }
        catch (err) {
            console.log(err);
            console.log(O.TPL.list());
        }

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
        var dElmId, registerKey;
        
        if (dElm !== undefined) {
            if (typeof dElm === 'string') {
                registerKey = dElm;
                dElm = O.ELM.pageContainer;
            } else {
                registerKey = dElm.getAttribute('data-register');
            }
            dElmId = dElm.id;
            if (dElmId.length === 0) {
                dElm.setAttribute('id', registerKey ? registerKey : 'elm'+parseInt(Math.random()*10000));
                dElmId = dElm.id;
            }
            if (registerKey === undefined || registerKey === null || registerKey.length === 0) {
                registerKey = dElmId;
            }
            O.CSS.remove(dElm,'register').add(dElm,'registering');

            var method = this.registry[registerKey];
            this.log('register %c' + (method ? '✓ ': '✗ ') + registerKey, this.logType.debug, method ? 'color: green' : 'color: red');
            if (method) {
                method(dElm, this.onElementRegistered.bind(this,dElmId));
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