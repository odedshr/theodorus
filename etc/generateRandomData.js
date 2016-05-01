(function generateRandomDataClosure () {
  'use strict';

  var assert = require('assert');

  var testUtils = require('../test/testUtils.js');

  var userCount, users = [];
  var communities = {};

  var colours = ['AliceBlue','AntiqueWhite','Aqua','Aquamarine','Azure','Beige','Bisque','Black','BlanchedAlmond','Blue','BlueViolet','Brown','BurlyWood','CadetBlue','Chartreuse','Chocolate','Coral','CornflowerBlue','Cornsilk','Crimson','Cyan','DarkBlue','DarkCyan','DarkGoldenRod','DarkGray','DarkGrey','DarkGreen','DarkKhaki','DarkMagenta','DarkOliveGreen','Darkorange','DarkOrchid','DarkRed','DarkSalmon','DarkSeaGreen','DarkSlateBlue','DarkSlateGray','DarkSlateGrey','DarkTurquoise','DarkViolet','DeepPink','DeepSkyBlue','DimGray','DimGrey','DodgerBlue','FireBrick','FloralWhite','ForestGreen','Fuchsia','Gainsboro','GhostWhite','Gold','GoldenRod','Gray','Grey','Green','GreenYellow','HoneyDew','HotPink','IndianRed','Indigo','Ivory','Khaki','Lavender','LavenderBlush','LawnGreen','LemonChiffon','LightBlue','LightCoral','LightCyan','LightGoldenRodYellow','LightGray','LightGrey','LightGreen','LightPink','LightSalmon','LightSeaGreen','LightSkyBlue','LightSlateGray','LightSlateGrey','LightSteelBlue','LightYellow','Lime','LimeGreen','Linen','Magenta','Maroon','MediumAquaMarine','MediumBlue','MediumOrchid','MediumPurple','MediumSeaGreen','MediumSlateBlue','MediumSpringGreen','MediumTurquoise','MediumVioletRed','MidnightBlue','MintCream','MistyRose','Moccasin','NavajoWhite','Navy','OldLace','Olive','OliveDrab','Orange','OrangeRed','Orchid','PaleGoldenRod','PaleGreen','PaleTurquoise','PaleVioletRed','PapayaWhip','PeachPuff','Peru','Pink','Plum','PowderBlue','Purple','Red','RosyBrown','RoyalBlue','SaddleBrown','Salmon','SandyBrown','SeaGreen','SeaShell','Sienna','Silver','SkyBlue','SlateBlue','SlateGray','SlateGrey','Snow','SpringGreen','SteelBlue','Tan','Teal','Thistle','Tomato','Turquoise','Violet','Wheat','White','WhiteSmoke','Yellow','YellowGreen'];
  var words = 'Lorem ipsum dolor sit amet consectetur adipiscing elit Duis nec pellentesque elit Nam id mi leo Praesent eu diam quis dui elementum sollicitudin eu non lectus Fusce in eros posuere egestas urna quis laoreet nunc Donec nec massa eget nisi lobortis egestas a et nisl Donec eleifend nisl in facilisis pulvinar nunc turpis scelerisque lectus nec pharetra augue ante ut nisi Ut et dolor a lectus congue ultricies Nam est lorem ullamcorper sit amet odio vitae consequat ultrices erat Phasellus sagittis sem vel tempus luctus magna velit consequat turpis vitae placerat nibh elit sit amet eros Duis non est placerat facilisis sem ut dictum erat Etiam egestas consectetur risus a finibus est vehicula sed Etiam elementum convallis pellentesque Ut varius ipsum quis metus sodales sed faucibus turpis venenatis Integer imperdiet congue felis vitae vulputate sem volutpat etFusce augue odio gravida a semper id iaculis id leo Aenean sagittis quam a eros feugiat facilisis Cras et gravida tortor Maecenas ut erat ex Sed bibendum libero ut massa scelerisque egestas Sed ut viverra orci eget auctor ante Donec gravida ligula ipsum a imperdiet arcu ullamcorper et Donec at ex suscipit pulvinar elit eget condimentum arcu    Duis sodales vehicula ligula at mollis massa hendrerit pulvinar Nam et eros odio Cras elementum risus in turpis imperdiet nec lobortis diam ultrices Proin convallis eu velit eget iaculis Sed et tellus sit amet risus imperdiet accumsan non sed tellus Donec ultrices ante vel condimentum euismod dui nibh posuere leo at varius diam dui at orci Nullam id enim ac dolor interdum accumsan Nullam vel lacus viverra consequat felis ac blandit mauris Proin varius quam eu venenatis pulvinar nisl orci congue eros nec dignissim massa eros id odio Suspendisse at nibh at nunc rhoncus maximus Cras et imperdiet diam molestie bibendum orci Morbi ullamcorper pulvinar ligula sed placerat Pellentesque congue a metus vitae finibus Nullam magna urna porttitor a orci vitae egestas dignissim urna    Pellentesque feugiat arcu a pretium ornare odio risus mattis eros id hendrerit nibh magna sed dui Phasellus varius est varius ante pharetra vel vulputate nibh ornare Nulla eu mi vel dolor finibus aliquam Nam ac felis aliquet sollicitudin dolor eget ornare massa Nam felis quam efficitur non odio at volutpat molestie diam Praesent elementum metus lobortis tristique sapien feugiat facilisis erat Fusce lacus dui blandit eget pretium et viverra eu justo Mauris quis lacus a urna scelerisque ornare Donec dictum vulputate tristique Mauris quis venenatis est Pellentesque posuere elit ac augue fringilla maximus Cras vel iaculis tellus    Vestibulum quis est dui Donec vitae eros tortor Donec at nisi eu massa ornare tristique Praesent in blandit tellus Vestibulum eget elit commodo eleifend urna sit amet fermentum dui Quisque rutrum felis cursus urna interdum dapibus Mauris dictum vel felis a elementum Nullam libero ipsum vehicula eu lorem finibus lacinia tincidunt sem Integer suscipit justo a molestie vulputate leo ligula tempus dui at mollis orci libero sed risus Vestibulum pellentesque quam vel aliquet porta Suspendisse convallis sapien ipsum sed congue eros porta et Sed vehicula'.split(' ');
  var wordCount = words.length;

  var actionCount = 5000;


  function randomText (count) {
    var acc = [];
    count = 1 + Math.floor(Math.random() * count);
    while (count--) {
      acc[count] = words[Math.floor(Math.random() * wordCount)];
    }
    return acc.join(' ');
  }

  (function createUsers () {
    var count = colours.length;
    while (count--) {
      var colour = colours[count];
      //var isFemale = (Math.random() > 0.5);
      //name : (isFemale ? 'Mrs.' : 'Mr.') +' '+ colour,
      //isFemale : isFemale
      users[count] = {
        name : colour,
        email : colour + '@test.suite.demo',
        memberships: []
      };
    }
    userCount = users.length;
  })();

  function doRandomAction() {
    try {
      var user = users[Math.floor(Math.random()*userCount)];
      console.log(actionCount + '. ' + user.name + ', '+ Object.keys(user.memberships).length);
      if (user.token === undefined) {
        testUtils.withTokenOf ( user.email, gotToken.bind(null,user));
      } else {
        checkCommunities(user);
      }
    }
    catch (err) {
      console.log(err);
      nextAction();
    }
  }

  function gotToken (user, token) {
    user.token = token;
    checkCommunities(user);
  }
  function checkCommunities (user) {
    if (user.memberships === undefined) {
      testUtils.getMemberships(user.token,gotMemberships.bind(null,user));
    } else {
      readyForAction(user);
    }
  }

  function gotMemberships (user, data) {
    user.memberships = data.memberships;
    readyForAction(user);
  }

  function readyForAction (user) {
    var membershipActionsWeight = user.memberships.length;
    var randomActionCode = Math.floor(Math.random() * (membershipActionsWeight +1));
    if (randomActionCode < membershipActionsWeight) {
      actionInCommunity(user, user.memberships[randomActionCode]);
    } else {
      var communityActionWeight = Object.keys(communities).length;

      randomActionCode = Math.floor(Math.random() * (communityActionWeight + 1));

      var membership = { name: user.name+(Math.floor(Math.random()*1000))};
      if (randomActionCode < communityActionWeight) {
        var communityId = Object.keys(communities)[randomActionCode];
        testUtils.addMembership (user.token, communityId, { membership: membership}, joinedCommunity.bind(null,user));
      } else {
        testUtils.addCommunity (user.token, { community: {
          name: randomText(3) + ' '+(Math.floor(Math.random()*1000)),
          topicLength: 10,
          opinionLength: 15,
          commentLength: 20
        }, founder: membership}, communityAdded.bind(null,user));
      }
    }
  }

  function communityAdded (user, data) {
    try {
      data.community.Topics = [];
      user.memberships.push (data.founder);
      communities[data.community.id] = data.community;
      console.log('added community');
      actionInCommunity(user,data.founder);
    }
    catch (err) {
      console.log(err);
      nextAction();
    }
  }

  function joinedCommunity (user, data) {
    user.memberships.push (data.membership);
    console.log('joined community ');
    actionInCommunity(user,data.membership);
  }

  function actionInCommunity (user, membership) {
    try {
      var community = communities[membership.communityId];
      if (community.Topics.length === 0) {
        testUtils.getTopics(community.id,gotTopics.bind(null, user,community));
      } else {
        gotTopics(user, community);
      }

    }
    catch (err) {
      console.log(err);
      nextAction();
    }
  }

  function gotTopics (user, parent, data) {
    try {
      if (data !== undefined) {
        parent.Topics = data.topics;
      }
      var items = parent.Topics;
      var count = items.length;
      var randomActionCode = Math.floor(Math.random() * (count +1));
      if ( randomActionCode >= count ) {
        testUtils.addTopic(user.token, parent.id, {topic: {content: randomText(10)}}, topicAdded.bind(null, parent));
      } else {
        var item = items[randomActionCode];
        if (item.Opinions === undefined || item.Opinions.length === 0) {
          item.Opinions = [];
          testUtils.getOpinions(item.id, gotOpinions.bind(null, user,item));
        } else {
          gotOpinions(user,item);
        }
      }
    }
    catch (err) {
      console.log(err);
      nextAction();
    }
  }

  function topicAdded (community, data) {
    data.topic.Opinions = [];
    community.Topics.push(data.topic);
    console.log('added topic');
    nextAction();
  }

  function gotOpinions (user, parent, data) {
    if (data !== undefined) {
      parent.Opinions = data.opinions;
    } else if (parent.Opinions === undefined) {
      parent.Opinions = [];
    }
    var items = parent.Opinions;
    var count = items.length;
    var randomActionCode = Math.floor(Math.random() * (count +1));
    if ( randomActionCode >= count ) {
      testUtils.addOpinion(user.token, parent.id, {opinion: {content: randomText(15)}}, opinionAdded.bind(null, parent));
    } else {
      var item = items[randomActionCode];
      if (item.Comments === undefined || item.Comments.length === 0) {
        testUtils.getComments(item.id, gotComments.bind(null, user,item));
      } else {
        gotComments(user,item);
      }
    }
  }

  function opinionAdded (topic, data) {
    data.opinion.Comments = [];
    topic.Opinions.push(data.opinion);
    console.log('added opinion');
    nextAction();
  }

  function gotComments (user, parent, data) {
    try {
      if (data !== undefined) {
        parent.Comments = data.comments;
      } else if (parent.Comments === undefined) {
        parent.Comments = [];
      }
      var items = parent.Comments;
      var count = items.length;
      var randomActionCode = Math.floor(Math.random() * (count +1));
      if ( randomActionCode >= count ) {
        testUtils.addComment(user.token, parent.id, {comment: {content: randomText(20)}}, commentAdded.bind(null, parent));
      } else {
        var item = items[randomActionCode];
        if (item.Comments.length === 0) {
          testUtils.getSubComments(item.id, gotSubComments.bind(null, user,item));
        } else {
          gotSubComments(user,item);
        }
      }
    }
    catch (err) {
      console.log(err);
      nextAction();
    }
  }

  function commentAdded (opinion, data) {
    data.comment.Comments = [];
    opinion.Comments.push(data.comment);
    console.log('added comment');
    nextAction();
  }

  function gotSubComments (user, parent, data) {
    try {
      if (data !== undefined) {
        parent.Comments = data.comments;
      } else if (parent.Comments === undefined) {
        parent.Comments = [];
      }
      var items = parent.Comments;
      var count = items.length;
      var randomActionCode = Math.floor(Math.random() * (count +1));
      if ( randomActionCode >= count ) {
        testUtils.addSubComment(user.token, parent.id, {comment: {content: randomText(20)}}, commentAdded.bind(null, parent));
      } else {
        var item = items[randomActionCode];
        if (item.Comments === undefined) {
          testUtils.getSubComments(item.id, gotSubComments.bind(null, user,item));
        } else {
          gotSubComments(user,item);
        }
      }
    }
    catch (err) {
      console.log(err);
      nextAction();
    }
  }

  function nextAction () {
    if (actionCount--) {
      doRandomAction();
    } else {
      var acc = 0;
      var communityIndex = Object.keys(communities);
      var i = communityIndex.length;
      while (i--) {
        acc += communities[communityIndex[i]].Topics.length;
      }
      console.log('completed, users = '+users.length+', communities = '+Object.keys(communities).length+', topics'+acc);
    }
  }

  function gotCommunities (data) {
    var list = data.communities;
    while (list.length) {
      var community = list.pop();
      community.Topics = [];
      communities[community.id] = community;
    }
    nextAction();
  }

  testUtils.getCommunities(gotCommunities);


})();