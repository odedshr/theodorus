app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};

  //=================================// Community Settings
  this.registry.communitySettingsPage = { preprocess: registerCommunitySettingsPage.bind(this) };

  function registerCommunitySettingsPage (dElm, callback) {
    if (!this.isAuthenticated()) {
      history.back ();
      callback ( {} );
      return false;
    }

    document.title = O.TPL.translate('title.communitySettings');
    var communityId = this.state.community;
    if (communityId !== undefined && communityId.length > 0) {
      this.api.async({
          'getCommunity': this.api.getCommunity.bind(this,communityId),
          'getAllUserImages': this.api.getAllUserImages.bind(this)
        },
        onCommunitySettingsDataLoaded.bind(this,callback));
    } else {
      this.updateURL('communities','');
    }
  }

  function onCommunitySettingsDataLoaded (callback, data) {
    var community = data.getCommunity.community;
    var membership = data.getCommunity.membership;
    this.state.communityJSON = community;
    this.state.membershipJSON = membership;
    if ((membership === undefined) || (membership.status !== 'active')) {
      this.updateURL('community:'+community.id+'/');
      return;
    }
    document.title = ''.concat(community.name,' ',O.TPL.translate('title.settings'));

    var dataForDisplay  = {
      communityId : community.id,
      communityName : community.name,
      hasImage: membership.hasImage,
      profileImage: membership.hasImage ? this.api.getProfileImageURL(membership.id) : '',
      images : this.getImageList (data.getAllUserImages.images, membership.id)
    };
    dataForDisplay.memberName = membership.name;
    dataForDisplay.email = this.state.email;
    callback(dataForDisplay);
  }

  this.registry.frmMembershipSettings = { attributes: { onsubmit: onSave.bind(this) }};

  function onSave (evt) {
    var profileImage = O.ELM.profileImagePreview;
    try {
      var data = {
        membership: this.getDirtyFormFields(evt.target)
      };
      data.membershipImage = profileImage.src;
      if (Object.keys(data.membership).length > 0 || profileImage.getAttribute('data-dirty')) {

        this.api.updateMembership(this.state.membershipJSON.id, data, this.updateURL.bind({},'community:'+this.state.community+'/'));
      } else {
        this.updateURL ('community:'+this.state.community+'/');
      }
    }
    catch (err) {
      if (err.errors.length) {
        var count = err.errors.length;
        while (count--) {
          this.log(err.errors[count], this.logType.error);
        }
      }
    }
    return false;
  }

  //=================================// member name field
  this.registry.uniqueMemberName = { attributes: { onchange: onMemberNameChange.bind(this) }};

  function onMemberNameChange (evt) {
    var dField = evt.target;
    this.setValidationMessage (dField, O.TPL.translate('message.checkingIfNameBeingUsed'));
    if (dField.value.length > 0) {
      var data = { membership: {
        communityId: this.state.community,
        name: dField.value
      } };
      this.api.membershipExists(data, onMemberExistsChecked.bind(this,dField));
    } else {
      this.setValidationMessage (dField, O.TPL.translate('message.thisFieldIsRequired'));
    }

  }

  function onMemberExistsChecked (dField,response) {
    this.setValidationMessage (dField, response.exists==='false' ? O.TPL.translate('message.namedAlreadyBeingUsed'): '');
  }

return this;}).call(app);
