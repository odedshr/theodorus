# Theodorus - A Stub to Democracy
Theodorus is a decision-making system, allowing users to collabirately craft a law proposal.
Any user may raise an `idea` for a law and if there are enough people voting for the idea,
it will become a `discussion`. Users then may propose their own version for each of the law's section and vote for
the favorite alternative. Once enough people support the law it will turn to a `A bill` and be given a limited
time in which all participants vote in favor or against turning it into a `Law`.

The goal of Theodorus is to provide an easy-to-use [Direct Democoracy](http://en.wikipedia.org/wiki/Direct_democracy),
to educate people to participate in the political debate and encourage them to express themselves politically.

* This is my first opensource proejct at github, so I'm still learning the trade. Please bare with me.
** I will appreciate any feedback regarding the project itself and its maintenance.

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
- v0.1 - stub (nothing there really)
- v0.2 - added topics (user may add a new topic)
- v0.3 - added comments
- v0.4 - added opinions (user can have a single opinion per topic, but may have a history of opinions)
- v0.5 - user profile-image
- v0.6 - tags
- v0.7 - fixed bug of profile-images folder deleted whenever a new version is released
- v0.8 - a basic verion of responsive css layout
- v0.8.1 - escaping all input to safe-tify input, fixed bug in responsive layout, added warning for DB integrity errors
- 0.9 - colored tags, much faster page loading and rendering
- 0.10 - fixed bug in signin, added email capabilities, added email confirmation
- 0.11 - use of localStorage to boost xslt and single-image to improve perfromance
- 0.12 - added "forgot password" + change password features
- 0.13 - bug fixes ("change password" should verify used is logged on, topic-by-tag has css error, email onError)
- 0.14 - add test-unit framework
- 0.15 - refactored to support plugins (not including xslt)
- 0.16 - db is built if not exists + encapsulate encryption
- 0.17 - xslt-plugin
- 0.18 - English (added theme) + added missing cheerio DOM manipulation
- 0.19 - ORM