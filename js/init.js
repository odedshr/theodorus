app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';
    var loadingInProgress = 0;
    this.backend = 'http://127.0.0.1:5000/';
    //this.backend = 'http://theo-dorus.rhcloud.com/';
    this.registry = this.registry || {};

    this.registry.appContainer = (function registerAppContainer (dElm, callback) {
        this.renderApplication(callback);
    }).bind(this);

    this.onCancelButtonClicked = (function onCancelButtonClicked () {
        history.back();
    }).bind(this);

    this.registry.btnCancel = (function registerAppContainer (dElm, callback) {
        dElm.onclick = this.onCancelButtonClicked;
    }).bind(this);

    this.isAuthenticated = (function isAuthenticated () {
        var token = O.COOKIE('authToken');
        return (token.length > 0);
    }).bind(this);

    this.onPageChanged = (function onPageChanged (evt) {
        var href = evt.detail.newURL;
        this.renderPage ( href.substr(href.indexOf('#')) , '');
    }).bind(this);

    this.updateURL = (function updateURL (hash, title) {
        history.pushState({}, title, hash);
        var appName = document.title.split(':')[0];
        document.title = appName + (title.length > 0 ? (': '+title) : '');
    }).bind(this);

    this.getPageTitleFromHashTag = (function getPageFromHashTag () {
        var hashData = this.extractArgumentsFromLocationHash();
        if (hashData.length) {
            var page = hashData[0].key;
            for (var i = 1; i < hashData.length; i++) {
                var word = hashData[i].key;
                page += ' '+ word.substr(0,1).toUpperCase() + word.substr(1);
            }
        } else {
            return '';
        }
        return page;
    }).bind(this);

    this.setAppTitle = (function setAppTitle (title) {
        var appName = document.title.split(':')[0];
        document.title = appName + (title.length > 0 ? (': '+title.substr(0,1).toUpperCase() +title.substr(1)) : '');
    }).bind(this);

    this.renderPage = (function renderPage () {
        var data = {};
        var title = this.getPageTitleFromHashTag();
        var pageTemplate = (title.length ? title.replace(/\s/g,'') : (this.isAuthenticated() ? 'home' : 'welcome'))+'PageTemplate';
        data[pageTemplate] = {};

        this.setAppTitle (title);

        this.render(O.ELM.pageContainer,data);
        this.register(O.ELM.pageContainer);
    }).bind(this);

    this.renderApplication = (function renderApplication (callback) {
        var token = O.COOKIE('authToken');
        var authenticated = (token.length > 0);
        if (authenticated) {
            O.AJAX.setDefaults({'credentials': token});
        }
        var title = this.getPageTitleFromHashTag();
        var pageTemplate = (title.length ? title.replace(/\s/g,'') : (authenticated ? 'home' : 'welcome'))+'PageTemplate';
        this.setAppTitle (title);

        this.render(O.ELM.appContainer,{ applicationTemplate:{ showUserDetailsInHeader:authenticated, page: pageTemplate }});
        if (callback) {
            callback();
        }
    }).bind(this);

    this.onComponentLoaded = (function onComponentLoaded () {
        if (!(--loadingInProgress)) {
            O.ELM.refresh();
            this.register(O.ELM.appContainer);
        }
    }).bind(this);

    this.init = (function init () {
        loadingInProgress = 4;

        window.onhashchange = O.EVT.subscribe('window.onhashchange', this.onPageChanged)
             .getDispatcher('window.onhashchange');

        O.EVT.subscribe('window.onload', this.onComponentLoaded)
            .subscribe('TPL.templatesLoaded', this.onComponentLoaded)
            .subscribe('TPL.languageLoaded', this.onComponentLoaded);
            //.subscribe('navLink.onclick', this.onNavLinkClicked);
        O.TPL.load('/templates/main.html');
        O.TPL.load('/templates/community.html');
        O.TPL.load('/templates/topic.html');
        O.TPL.setLocale('en-us');
        O.TPL.loadLanguage('/i18n/en-us.json');
    }).bind(this);


    this.init();
return this;}).call(app);