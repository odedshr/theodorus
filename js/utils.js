app = (typeof app != "undefined") ? app:{};
(function utilsEnclosure() {
    'use strict';

    this.registry = this.templates || {};
    this.templates = this.templates || {};

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

    this.notify = (function notify (data) {
        var dNotifications = O.ELM.notifications;
        if (dNotifications === undefined) {
            dNotifications = O.ELM.appContainer;
        }
        O.DOM.append(dNotifications,O.TPL.render(data));
        O.ELM.refresh();
        this.register(dNotifications.childNodes[dNotifications.childNodes.length-1]);
    }).bind(this);

    //==================================/
    this.confirm  = (function confirm (string, callback) {
        callback(window.confirm(string));
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
        var hash =  (this.state.redirect ? this.state.redirect : '');
        history.pushState({}, hash, location.href.split('#')[0]+'#'+ hash);
        this.register(O.ELM.appContainer);
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
    this.getFormFields = (function getFormFields (formElement) {
        var formFields = formElement.elements;
        var data = {};
        for (var field in formFields) {
            if (formFields.hasOwnProperty(field)) {
                var element = formFields[field];
                if (element.name) {
                    data[element.name] = (element.type=="checkbox") ? (element.checked) : element.value;
                }
            }
        }
        return data;
    }).bind(this);
    //==================================/
    this.resizeImage = (function resizeImage (imgDataURL, maxWidth, maxHeight)
    {
        // load image from data url
        var imageObj = new Image();
        imageObj.src = imgDataURL;

        var ratio = 1;
        var canvas = document.createElement('canvas');
        canvas.style.display='none';
        document.body.appendChild(canvas);
        var context = canvas.getContext('2d');
        context.drawImage(imageObj, 0, 0);

        var canvasCopy = document.createElement('canvas');
        canvasCopy.style.display='none';
        document.body.appendChild(canvasCopy);
        var ctx = canvas.getContext('2d');
        var copyContext = canvasCopy.getContext('2d');
        if(imageObj.width > maxWidth)
            ratio = maxWidth / imageObj.width;
        else if(imageObj.height > maxHeight)
            ratio = maxHeight / img.height;
        canvasCopy.width = imageObj.width;
        canvasCopy.height = imageObj.height;
        copyContext.drawImage(imageObj, 0, 0);

        var imgWidth = imageObj.width * ratio;
        var imgHeight =  imageObj.height * ratio;
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        ctx.drawImage(canvasCopy, (maxWidth - imgWidth)/2, (maxHeight - imgHeight)/2, imgWidth,  imgHeight);
        var dataURL = canvas.toDataURL('image/png');
        document.body.removeChild(canvas);
        document.body.removeChild(canvasCopy);
        return dataURL; //dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
    }).bind(this);

    //==================================/
    this.registerChildren = (function registerChildren (subElements) {
        var elmCount = subElements.length;
        while (elmCount--) {
            var dElm = subElements[elmCount];
            if (dElm.style.display !== 'none') {
                this.register(dElm);
            }
        }
    }).bind(this);

    function render (dElm, templateName, content) {
        if (templateName === undefined) {
            if (content === undefined) {
                return;
            } else {
                this.log('no template for ' + templateName, this.logType.debug);
                throw new Error('template-not-found');
            }
        }

        try {
            if (this.templates[templateName]) {
                var data = {};
                data[templateName] = content;
                dElm.innerHTML = O.TPL.render(data);
                O.ELM.refresh();
            } else {
                this.log('no template for ' + templateName,this.logType.debug);
            }
            this.registerChildren(dElm.querySelectorAll('[data-register]:not(.js-registered)'));
        }
        catch (err) {
            this.log(err,this.logType.debug);
        }
    }

    this.register = (function register (dElm) {
        var templateName = dElm.getAttribute('data-register');

        if ( templateName === undefined ) {
            templateName = dElm.getAttribute ('id');
        }
        O.CSS.remove(dElm,'register').add (dElm,'registering');

        var component = this.registry[templateName];
        if (component !== undefined && component.attributes !== undefined) {
            var attr = component.attributes;
            for (var key in attr) {
                dElm[key] = attr[key];
            }
        }

        if (component === undefined) {
            if (this.templates[templateName] === undefined) {
                throw new Error('cannot register template '+templateName);
            } else {
                render.call(this, dElm,templateName, {});
            }
        } else if (component.preprocess !== undefined){
            component.preprocess.call(this, dElm, render.bind(this,dElm,templateName));
        }

        O.CSS.remove(dElm,'registering').add(dElm,'registered');
    }).bind(this);

    this.onWindowResize = (function onWindowResize() {
        this.registerChildren(O.ELM.per('.js-register'));
    }).bind(this);

    window.onresize = O.EVT.subscribe('window.resize',this.onWindowResize).getDispatcher('window.resize');

return this;}).call(app);