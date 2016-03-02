app = (typeof app != "undefined") ? app:{};
(function communityEnclosure() {
    'use strict';
    this.registry = this.registry || {};

    O.EVT.subscribe('toggle-opinion',toggleOpinions.bind(this));

    this.registry.tglOpinion = (function registerToggleOpinions (dElm, callback) {
        dElm.onclick = O.EVT.getDispatcher('toggle-opinion');
        callback();
    }).bind(this);

    function toggleOpinions (evt) {
        var topicElement = evt.detail.target.closest('[data-type="topic"]');
        var topicId = topicElement.getAttribute('data-id');
        var opinionElm = topicElement.querySelector('[data-role="opinions"]');
        if (opinionElm.getAttribute('data-hidden') === 'true') {
            O.ELM.per('[data-role="opinions"]:not([data-hidden="true"])').each(function (dElement) {
                dElement.setAttribute('data-hidden', 'true');
                dElement.innerHTML = '';
            });
            loadOpinionList.call(this, topicId);
            opinionElm.removeAttribute('data-hidden');
        } else {
            opinionElm.setAttribute('data-hidden', 'true');
        }
    }

    function loadOpinionList (topicId) {
        this.api.getTopicOpinions(topicId, renderOpinionList.bind(this, topicId));
    }

    function renderOpinionList (topicId, opinions) {
        var count = opinions.length;
        var membership = this.state.communityJSON.membership;
        var membershipId = membership ? membership.id : false;
        var myOpinion = false;
        var myOpinionIndex = 0;

        O.ELM['topic_'+topicId+'_opinion_count'].innerHTML = count;

        while (count--) {
            var opinion = opinions[count];
            opinion.time = moment(opinion.modified).format("MMM Do YY, h:mma");
            opinion.relativeTime = moment(opinion.modified).fromNow();
            opinion.mine = (membershipId === opinion.authorId);
            opinion.isArchivable = opinion.mine && (opinion.comments === 0) && (opinion.endorse === 0);
            if (opinion.mine) {
                myOpinionIndex = count;
                myOpinion = opinion;
                opinion.topicId = topicId;
            }
        }
        var displayedData = {
            opinions:{opinion:opinions}
        };
        if (myOpinion) {
            opinions.splice(myOpinionIndex,1);
            opinions.unshift(myOpinion);
        } else if (membership) {
            displayedData.hasMyOpinion = myOpinion;
            displayedData.opinionMeta = {
                topicId : topicId,
                content : '',
                author : {
                    name : membership.name
                }
            };
        }
        var dElm = O.ELM['topic_'+topicId+'_opinion_list'];
        this.render(dElm, { opinionList: displayedData });
        this.register(dElm);
    }

    this.registry.frmAddOpinion = (function registerAddOpinionForm (dElm, callback) {
        dElm.onsubmit = O.EVT.subscribe('submit-add-opinion',addOpinion.bind(this)).getDispatcher('submit-add-opinion');
        callback();
    }).bind(this);

    function addOpinion () {
        var content = O.ELM.opinionContent.value;
        var topicId = O.ELM.opinionTopicId.value;
        if (!this.models.opinion.topicId.validate(topicId)) {
            this.log('topicId = ' + topicId);
        } else if (!this.models.opinion.content.validate(content, this.state.communityJSON)) {
            this.log('content = ' + content);
        } else {
            var data = {
                communityId : this.state.community,
                topicId : topicId,
                content: content,
                status: 'published'
            };
            this.api.setOpinion(data, onOpinionAdded.bind(this, topicId));
        }
        return false;
    }

    function onOpinionAdded (topicId) {
        loadOpinionList.call(this, topicId);
    }
return this;}).call(app);