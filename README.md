Theodorus - A Stub to Democracy
===================
Theodorus is a decision-making system, allowing users to collabirately craft a law proposal.
Any user may raise an `idea` for a law and if there are enough people voting for the idea,
it will become a `discussion`. Users then may propose their own version for each of the law's section and vote for
the favorite alternative. Once enough people support the law it will turn to a `A bill` and be given a limited
time in which all participants vote in favor or against turning it into a `Law`.

The goal of Theodorus is to provide an easy-to-use [Direct Democoracy](http://en.wikipedia.org/wiki/Direct_democracy),
to educate people to participate in the political debate and encourage them to express themselves politically.

* This is my first opensource proejct at github, so I'm still learning the trade. Please bare with me.
** I will appreciate any feedback regarding the project itself and its maintenance.

Settings to configure
=====================
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