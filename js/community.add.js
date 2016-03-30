app = (typeof app !== 'undefined') ? app : {};
(function communityEnclosure() {
  /*jshint validthis: true */
  'use strict';

  this.registry = this.registry || {};
  this.registry.communityAddPage = { preprocess : registerCreateCommunityForm.bind(this) };
  this.registry.frmAddCommunity = { attributes: { onsubmit:  onAddSubmitted.bind(this) } };

  function registerCreateCommunityForm (dElm, callback) {
    this.api.getMyCommunities (getMostCommonMembershipName.bind(this, callback));
  }

  function getMostCommonMembershipName (callback, communities) {
    var maxName = '', maxCount = 0;
    var count = {};
    var i = communities.length;
    while (i--) {
      var name = communities[i].membershipName;
      var nameCount = count[name];
      nameCount = (count[name] === undefined) ? 1 : nameCount + 1;
      count[name] = nameCount;
      if (nameCount >= maxCount) {
        maxName = name;
        maxCount = nameCount;
      }
    }
     callback({founderName : maxName});
  }

  function onAddSubmitted (evt) {
    var data = this.getFormFields(evt.target);
    this.api.addCommunity(data, onCommunityAdded.bind(this));
    return false;
  }

  function onCommunityAdded (response) {
    if (response instanceof Error || !response) {
      alert ('failed to add community');
      console.log(response);
    } else {
      location.href = '#community:'+response.id;
    }
  }

  //=================================// community name field
  this.registry.uniqueCommunityName = { attributes: { onchange: onCommunityNameChange.bind(this) }};

  function onCommunityNameChange (evt) {
    var dField = evt.target;
    this.setValidationMessage (dField, O.TPL.translate('message.checkingIfNameBeingUsed'));
    if (dField.value.length > 0) {
      this.api.communityExists(this.state.community, dField.value, onCommunityExistsChecked.bind(this,dField));
    } else {
      this.setValidationMessage (dField, O.TPL.translate('message.thisFieldIsRequired'));
    }

  }

  function onCommunityExistsChecked (dField,response) {
    this.setValidationMessage (dField, response ? O.TPL.translate('message.namedAlreadyBeingUsed'): '');
  }

return this;}).call(app);
