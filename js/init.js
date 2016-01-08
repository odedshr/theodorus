(function initEnclosure() {
    //O.AJAX.get('http://theo-dorus.rhcloud.com/', function callback (response) {
    //    console.log(response);
    //});

    function onComponentLoaded () {
        if (!(--loadingInProgress)) {
            O.ELM.body.innerHTML = O.TPL.render({anonymousTemplate:{}});
        }
    }

    var loadingInProgress = 3;
    O.EVT.subscribe('window.onload',onComponentLoaded)
         .subscribe('TPL.templatesLoaded',onComponentLoaded)
         .subscribe('TPL.languageLoaded',onComponentLoaded);
    O.TPL.load('/templates/main.html');
    O.TPL.loadLanguage('/i18n/en.json');
})();