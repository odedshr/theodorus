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

###  Installation
  1. sign up for openshift
  2. create a new app
  3. Use cartridge "node.js 0.10"
  4. use the git source code https://github.com/odedshr/theodorus.git master
  5. "I would like to make changes in the code" - setup your public key
  6. Add cartridge "MySQL 5.5"
  7. Enable Jenkins
  8. You may want to add phpMyAdmin 4.0 if you used non-scalable process
  9. For local server, be sure to install Imagemagick (for mac os x it's "brew install imagemagick")
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