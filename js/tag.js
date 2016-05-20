app = (typeof app !== 'undefined') ? app : {};
(function tagEnclosure() {
  this.registry = this.registry || {};

  //////////////////////////////////////////////////////////////////////////////

  this.registry.topTags = { preprocess: (getTopTags).bind(this), template: 'tagCloud' };

  function getTopTags(dElm, callback) {
    var cached = this.registry.topTags.cached;
    if (!!cached) { //used cache
      callback( { tags: { tag: cached } } );
    } else {
      this.api.getTopTags(1, 100, gotTopTags.bind(this, callback));
    }
  }

  function gotTopTags(callback, data) {
    var tag, tagCount, tags, maxValue;

    if (data instanceof Error) {
      this.log('failed to load tag list',this.logType.error);
      this.log(data,this.logType.debug);
      return callback ({ tags: { tag: [] } });
    }

    tagCount = data.tags;
    tags = Object.keys(tagCount);
    tags.sort(sortTags);
    maxValue = maxCount(tags, tagCount);

    for (var i =0, length = tags.length; i < length; i++) {
      tag = tags[i];
      tags[i] = { string: tag, score: Math.round(tagCount[tag]/maxValue*10) };
    }
    callback( { tags: { tag: tags } } );
  }

  function sortTags (a,b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }

  function maxCount( keys, tagMap ) {
    var value = 0;
    for (var i =0, length = keys.length; i < length; i++) {
      value = Math.max (value, tagMap[keys[i]]);
    }
    return value;
  }

  //////////////////////////////////////////////////////////////////////////////

  this.registry.filterByTag = { attributes: { onclick: filterByTag.bind(this) } };

  function filterByTag (evt) {
    var dTag = evt.target;
    dTag.setAttribute('aria-pressed',(dTag.getAttribute('aria-pressed') !== 'true'));
    refreshTopicListByTags.call(this,dTag.closest('[role="list"]'));
  }

  function refreshTopicListByTags (dTagList) {
    var i = 0, tags = [],
        target = dTagList.closest('[aria-controls]').getAttribute('aria-controls'),
        dTags = dTagList.querySelectorAll('[aria-pressed="true"]'),
        length = dTags.length;

    for (; i < length; i++) {
      tags.push(dTags[i].innerHTML);
    }
    if (tags.length > 0) {
      this.api.getTopicsByTag(tags,
        this.processTopicList.bind(this,
          onTaggedTopicListReady.bind(this, O.ELM[target])));      
    } else {
      this.register(O.ELM[target]);
    }

  }

  function onTaggedTopicListReady (dTarget, data) {
    dTarget.innerHTML = O.TPL.render({'topicList' : data});
  }

  //////////////////////////////////////////////////////////////////////////////
return this;}).call(app);
