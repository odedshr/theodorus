app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';
    var loadingInProgress = 0;

    this.registry = this.registry || {};
    this.state = this.state || {};

    this.registry.ping = (function registerPingButton (dElm, callback) {
        dElm.onclick = O.EVT.subscribe('ping',this.api.ping.bind(this,pong)).getDispatcher('ping');
        callback();
    }).bind(this);

    var renderApplication = (function renderApplication () {
        var token = O.COOKIE('authToken');
        var authenticated = (token.length > 0);
        if (authenticated) {
            O.AJAX.setDefaults({'credentials': token});
        }

        this.render(O.ELM.appContainer,{ application: { showUserDetailsInHeader:authenticated }});
        this.register(O.ELM.appContainer);
    }).bind(this);

    function pong () {
        if (O.ELM.connectionError !== undefined) {
            O.DOM.remove(O.ELM.connectionError);
        }
    }

    this.onConnectionError = (function onConnectionError (){
        if (O.ELM.connectionError === undefined) {
            this.notify({notifyErrorConnection:{}});
        }
    }).bind(this);

    this.onComponentLoaded = (function onComponentLoaded () {
        if (!(--loadingInProgress)) {
            window.onhashchange = O.EVT.subscribe('window.onhashchange', this.onPageChanged)
                .getDispatcher('window.onhashchange');

            O.ELM.refresh();
            renderApplication();
            this.api.ping(pong);
        }
    }).bind(this);

    this.init = (function init () {
        loadingInProgress = 3;


        O.EVT.subscribe('window.onload', this.onComponentLoaded)
            .subscribe('TPL.templatesLoaded', this.onComponentLoaded)
            .subscribe('TPL.languageLoaded', this.onComponentLoaded)
            .subscribe('connection-error',this.onConnectionError);
        //.subscribe('navLink.onclick', this.onNavLinkClicked);
        O.TPL.load('templates.html');
        O.TPL.setLocale('en-us');
        O.TPL.loadLanguage('i18n/en-us.json');
    }).bind(this);


    this.init();
    return this;}).call(app);