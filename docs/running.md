# Theodorus - running

To start Theodorus. simply type 'npm start' in the app root folder.

## Parameters

 The following parameters are available:

 - mode: prod/dev
    Default is prod.
 - include: all/backend/webapp/docs
    Default is all.
    It's possible to run only some of the modules using '+' symbol
 - build: yes/no/auto
    Default is auto
    'auto' will build only if webapp.tmp folder doesn't exists or is empty

 Parameters are as in example:

  'npm start mode=dev include=backend+docs'
