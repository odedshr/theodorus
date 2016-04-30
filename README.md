[![Build Status](https://travis-ci.org/odedshr/theodorus.svg?branch=gh-pages.src)](https://travis-ci.org/odedshr/theodorus) [![Dependency Status](https://david-dm.org/odedshr/theodorus.svg?theme=shields.io)](https://david-dm.org/odedshr/theodorus) [![license](http://img.shields.io/badge/license-GNU-brightgreen.svg)](https://github.com/odedshr/theodorus/blob/master/LICENSE)

# Theodorus - A Stub to Democracy

![Theodorus](https://raw.githubusercontent.com/odedshr/theodorus/gh-pages.src/img/logo.png "Theodorus")

Theodorus is a decision-making system, allowing users to collaboratively craft a law proposal.
Any user may raise an `idea` for a law and if there are enough people voting for the idea,
it will become a `discussion`. Users then may propose their own version for each of the law's section and vote for
the favorite alternative. Once enough people support the law it will turn to a `A bill` and be given a limited
time in which all participants vote in favor or against turning it into a `Law`.

The goal of Theodorus is to provide an easy-to-use [Direct Democracy](http://en.wikipedia.org/wiki/Direct_democracy),
to educate people to participate in the political debate and encourage them to express themselves politically.

* This is my first open-source project at github, so I'm still learning the trade. Please bare with me.
** I will appreciate any feedback regarding the project itself and its maintenance.

## Models
* User
  - It has login credentials (username, password)
* Community
  - User can belong to one or more communities
  - A community can be visible to all or to members-only
  - Joining a community can be limited to invitation-only, invitation and/or request, free for all
  - User can create their own communities
  - Community has a name, a description and a logo
  - Community can decide whether permissions and penalties are visible or private
* Membership is the relationship between a user and a community
  - It has a display name
  - It has a profile image
  - It has a score
  - It has bio (100 words)
  - It has the set of available permissions
  - It has a list of penalties
  - It has the flag "moderator"
  - It has a flag "public" making all his actions visible to other members in the community
  - It has the flag "representative" (so others members can endorse him)
* ProfileImage is an image that belongs to a user
  - he can link it to different memberships
  - user can add up to 10 different profileImages
  - User can only remove profilesImages that are not linked to a membership
* Message can be either:
  - Topic is the beginning of a discussion in a community.
      - It contains a message of 140 characters
      - It may contain up to 140 different links
      - It has a single creator (a user)
  - Response is a user's response to a topic
      - It contains a message of 140 characters (or 140 links)
      - A user may have a single response per topic
  - Comment is a feedback to a response or to another comment
      - It contains a message of 100 words
      - A user may have many comments to per response
* Rating is set of values a user can give to topic/response/comment
  - It contains the flags - Endorse, Follow, Report
  - Endorse and Report are mutually exclusive
* Interaction is the relationship between user to another user in his community
  - He can follow (meaning, he'll get notification on the user's activities)
  - He can endorse (meaning, he'll automatically endorse anything the representative will endorse)
  - He can report of misconduct



### Settings to configure
The following items should be configured as a environment variables (that way they are hidden by anyone plainly looking
at your code). Use the command line (or terminal console) to set them:
E.g. setenv THEODORUS_MAIL_SERVICE Gmail
You can also write them to your config.json which is much easier, but less secured. Please not that environment variables
 overrides config.json

* process.env.THEODORUS_MODE : "dev", "test", "prod"
* RSA information:
  - process.env.THEODORUS_RSA_ENCRYPT
  - process.env.THEODORUS_RSA_DECRYPT
  - process.env.THEODORUS_RSA_MODULUS
* OPENSHIFT infromation (this is set automatically by open-shift)
  - process.env.OPENSHIFT_NODEJS_IP
  - process.env.OPENSHIFT_NODEJS_PORT
* DB information
  - process.env.THEODORUS_MYSQL_HOST
  - process.env.THEODORUS_MYSQL_PORT
  - process.env.THEODORUS_MYSQL_USER
  - process.env.THEODORUS_MYSQL_PASSWORD
  - process.env.THEODORUS_MYSQL_SCHEMA
* Mailer information
  - process.env.THEODORUS_MAIL_SERVICE (e.g. "Gmail")
  - process.env.THEODORUS_MAIL_USER (e.g. "my-email@gmail.com")
  - process.env.THEODORUS_MAIL_PASSWORD (e.g. "7ru57n01")

###  Installation
  1. sign up for openshift
  2. create a new app
  3. Use cartridge "node.js 0.10"
  4. use the git source code https://github.com/odedshr/theodorus.git master
  5. "I would like to make changes in the code" - setup your public key
  6. Add cartridge "MySQL 5.5"
  7. Enable Jenkins
  8. You may want to add phpMyAdmin 4.0 if you used non-scalable process
  9. For local server
  9.2 the above mentioned settings:
  ```bash
  sudo vi /etc/launchd.conf
  ```
  9.1. be sure to install Imagemagick (for mac os x it's "brew install imagemagick")
  10. make sure git won't delete the profile-images folder:
  ```bash
rhc ssh -a #cartridge_name#
cd /runtime/theodorus-profile-images
 touch .gitkeep
  ```

###  Release Notes
- 2013/08/31 - v0.1 - stub (nothing there really)
- 2014/01/24 - v0.2 - added topics (user may add a new topic)
- 2014/02/03 - v0.3 - added comments
- 2014/04/03 - v0.4 - added opinions (user can have a single opinion per topic, but may have a history of opinions)
- 2014/05/18 - v0.5 - user profile-image
- 2014/05/31 - v0.6 - tags
- 2014/05/31 - v0.7 - fixed bug of profile-images folder deleted whenever a new version is released
- 2014/06/03 - v0.8 - a basic verion of responsive css layout
- 2014/06/03 - v0.8.1 - escaping all input to safe-tify input, fixed bug in responsive layout, added warning for DB integrity errors
- 2014/06/03 - 0.9 - colored tags, much faster page loading and rendering
- 2014/06/19 - 0.10 - fixed bug in signin, added email capabilities, added email confirmation
- 2014/06/12 - 0.11 - use of localStorage to boost xslt and single-image to improve perfromance
- 2014/06/13 - 0.12 - added "forgot password" + change password features
- 2014/06/19 - 0.13 - bug fixes ("change password" should verify used is logged on, topic-by-tag has css error, email onError)
- 2014/07/28 - 0.14 - add test-unit framework
- 2014/07/29 - 0.15 - refactored to support plugins (not including xslt)
- 2014/08/16 - 0.16 - db is built if not exists + encapsulate encryption
- 2014/08/22 - 0.17 - xslt-plugin
- 2014/08/24 - 0.18 - English (added theme) + added missing cheerio DOM manipulation
- 2014/09/06 - 0.19 - ORM
- 2014/09/12 - 0.19.1 - fixed some bugs caused by the plugin change
- 2014/09/14 - 0.20 - Grunt
- 2014/09/14 - 0.21 - topic-draft editing
- 2014/09/14 - 0.22 - changing topic status from idea to discussion to draft
