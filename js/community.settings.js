app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';

    this.registry = this.registry || {};
    this.components = this.components || {};

    //=================================// Community Settings
    this.registry.communitySettingsPage = { preprocess: registerCommunitySettingsPage.bind(this) };

    function registerCommunitySettingsPage (dElm, callback) {
        document.title = O.TPL.translate('title.communitySettings');
        var communityId = this.state.community;
        if (communityId !== undefined && communityId.length > 0) {
            this.api.getCommunity (communityId, onCommunitySettingsDataLoaded.bind(this,callback));
        } else {
            this.updateURL('communities','');
        }
    }

    function onCommunitySettingsDataLoaded (callback, communityData) {
        this.state.communityJSON = communityData;
        if ((communityData.membership === undefined) || (communityData.membership.status !== 'active')) {
            this.updateURL('community:'+communityData.id+'/', O.TPL.translate('pageTitle.community'));
            return;
        }
        document.title = ''.concat(communityData.name,' ',O.TPL.translate('title.settings'));
        var dataForDisplay  = {
            communityId : communityData.id,
            communityName : communityData.name,
            profileImage: this.api.getProfileImageURL(communityData.membership.id)
        };
        if (dataForDisplay.isMember) {
            dataForDisplay.memberName = communityData.membership.name ? communityData.membership.name : '';
        }
        dataForDisplay.email = this.state.email;
        callback(dataForDisplay);
    }

    this.registry.imageProfileChooser = { attributes: { onchange: onLoadImageProfile.bind(this) }};
    this.registry.btnUpdateProfileImage = { attributes: { onclick: onUploadImageProfile.bind(this) }};

    function onLoadImageProfile (evt) {
        var file = evt.target.files[0];
        var fileReader = new FileReader();
        fileReader.onload = onImageProfileLoaded.bind(this);
        fileReader.readAsDataURL(file);

        return false;
    }

    function onImageProfileLoaded (evt) {
        try {
            O.ELM.profileImagePreview.src = this.resizeImage(evt.target.result, 128, 128);
        }
        catch (err) {
            this.log(err);
        }
    }

    function onUploadImageProfile (evt) {
        var data = O.ELM.profileImagePreview.src;
        this.api.updateProfileImage(this.state.communityJSON.membership.id,{ image: data },this.simplyReturn);

        return false;
    }

return this;}).call(app);