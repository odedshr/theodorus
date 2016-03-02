app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';
    var loadingInProgress = 0;

    this.registry = this.registry || {};
    this.state = this.state || {};

    var renderApplication = (function renderApplication () {
        var token = O.COOKIE('authToken');
        var authenticated = (token.length > 0);
        if (authenticated) {
            O.AJAX.setDefaults({'credentials': token});
        }

        this.render(O.ELM.appContainer,{ application: { showUserDetailsInHeader:authenticated }});
        this.register(O.ELM.appContainer);
    }).bind(this);

    this.onComponentLoaded = (function onComponentLoaded () {
        if (!(--loadingInProgress)) {
            window.onhashchange = O.EVT.subscribe('window.onhashchange', this.onPageChanged)
                .getDispatcher('window.onhashchange');

            O.ELM.refresh();
            renderApplication();
        }
    }).bind(this);

    this.init = (function init () {
        loadingInProgress = 3;


        O.EVT.subscribe('window.onload', this.onComponentLoaded)
            .subscribe('TPL.templatesLoaded', this.onComponentLoaded)
            .subscribe('TPL.languageLoaded', this.onComponentLoaded);
            //.subscribe('navLink.onclick', this.onNavLinkClicked);
        O.TPL.load('templates.html');
        O.TPL.setLocale('en-us');
        O.TPL.loadLanguage('i18n/en-us.json');
    }).bind(this);


    this.init();
return this;}).call(app);