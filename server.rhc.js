process.env.THEODORUS_MODE="prod";
process.env.THEODORUS_RSA_ENCRYPT="10001";
process.env.THEODORUS_RSA_DECRYPT="202700adbd85e2d7182720c3a0ee19c1";
process.env.THEODORUS_RSA_MODULUS="30db31542ace0f7d37a629ee5eba28cb";
process.env.THEODORUS_MYSQL_HOST=process.env.OPENSHIFT_MYSQL_DB_HOST;
process.env.THEODORUS_MYSQL_PORT=process.env.OPENSHIFT_MYSQL_DB_PORT;
process.env.THEODORUS_MYSQL_USER="theodorus_user";
process.env.THEODORUS_MYSQL_PASSWORD="cxsXHcdAUEbhUusQ";
process.env.THEODORUS_MYSQL_SCHEMA="theo";

require ("./www/web.js");