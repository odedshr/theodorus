app = (typeof app != "undefined") ? app:{};
(function initEnclosure() {
    'use strict';
    var loadingInProgress = 0;

    this.registry = this.registry || {};
    this.state = this.state || {};

    this.registry.appContainer = (function registerAppContainer (dElm, callback) {
        this.renderPage();
    }).bind(this);

    this.onCancelButtonClicked = (function onCancelButtonClicked () {
        history.back();
    }).bind(this);

    this.registry.btnCancel = (function registerCancelButton (dElm, callback) {
        dElm.onclick = this.onCancelButtonClicked;
    }).bind(this);

    this.registry.notFoundPage = (function registerPageNotFound (dElm, callback) {
        O.ELM.frmPageNotFound.onsubmit = O.EVT.subscribe('submit-page-not-found',onPageNotFoundSubmitted.bind(this)).getDispatcher('submit-page-not-found');
        O.ELM.pageNotFoundURL.value = window.location.hash;
    }).bind(this);

    function onPageNotFoundSubmitted () {
        this.log ('not yet implemented', this.logType.error);
        return false;
    }

    this.isAuthenticated = (function isAuthenticated () {
        var token = O.COOKIE('authToken');
        return (token.length > 0);
    }).bind(this);

    this.onPageChanged = (function onPageChanged (evt) {
        var href = evt.detail.newURL;
        this.renderPage ( href.substr(href.indexOf('#')) , '');
    }).bind(this);

    this.updateURL = (function updateURL (hash, title) {
        history.pushState({}, title, location.href.split('#')[0]+'#'+ hash);
        this.renderPage();
    }).bind(this);

    this.getPageTitleFromHash = (function getPageFromHash (hashData) {
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
        console.log(location.href);
        var data = {};
        var hashData = this.extractArgumentsFromLocationHash();
        var title = this.getPageTitleFromHash(hashData);
        var pageTemplate = (title.length ? title.replace(/\s/g,'') : (this.isAuthenticated() ? 'home' : 'welcome'))+'Page';
        O.ELM.appContainer.setAttribute('data-section',hashData.length > 0 ? hashData[0].key : 'home');
        if (O.TPL.list().indexOf(pageTemplate) === -1) {
            pageTemplate = "notFoundPage";
        }
        data[pageTemplate] = {};

        this.state = this.getMappedArguments();

        this.setAppTitle (title);
        this.log('renderPage '+ pageTemplate, this.logType.debug);
        this.render(O.ELM.pageContainer,data);
        this.register(pageTemplate);
    }).bind(this);

    //==========================

    O.EVT.subscribe('archive',archive.bind(this));

    this.registry.archive = (function registerArchiveTopic (dElm, callback) {
        dElm.onclick = O.EVT.getDispatcher('archive');
        callback();
    }).bind(this);

    function archive (evt) {
        var dElm = evt.detail.target.closest('[data-id][data-type]');
        var type = dElm.getAttribute('data-type');
        var id = dElm.getAttribute('data-id');
        var parentNode = dElm.parentNode;
        this.api.archive(type, id, this.simplyReturn);
        this.updateCount(parentNode.closest('[data-id][data-type]'), dElm.getAttribute('data-type'),-1);
        if (type !== 'opinion') {
            O.DOM.remove(parentNode);
        } else {
            O.ELM.opinionContent.value = '';
        }
    }

    //==========================

    this.updateCount = (function updateCount (dElm, countSubject ,delta) {
        if (dElm) {
            var dCount = dElm.querySelector('[data-role="'+countSubject+'-count"]');
            if (dCount) {
                dCount.innerHTML = +dCount.innerHTML + delta;
            }
        }
    }).bind(this);

return this;}).call(app);