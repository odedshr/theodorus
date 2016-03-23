app = (typeof app != "undefined") ? app:{};
(function bugReportEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    this.registry.mePage = { preprocess: loadUserSettings };

    function loadUserSettings (dElm, callback) {
        document.title = O.TPL.translate('title.settings');
        callback();
    }

return this;}).call(app);