;(function ContextClosure() {
  'use strict';

  var _ = require('underscore'),
      url = require('url'),

      config = require('../helpers/config.js'),
      Encryption = require('../helpers/Encryption.js'),
      Errors = require('../helpers/Errors.js'),
      log = require('../helpers/logger.js'),

      validations = require('../helpers/validations.js'),
      urlParameterPattern = validations.urlParameterPattern,
      idPattern = validations.maskedIdPattern,
      emailPattern = validations.emailPatternString,

      apiUrlPrefix = config('apiUrlPrefix');

  if (apiUrlPrefix === undefined) {
    apiUrlPrefix = '';
  }

  function getKeys(urlFormat) {
    var matches,
        keys = [];

    urlParameterPattern.lastIndex = 0;

    while ((matches = urlParameterPattern.exec(urlFormat)) !== null) {
      keys.push(matches[1]);
    }

    return keys;
  }

  function read(req, urlFormat, reURL) {
    var keys,
        values,
        count,
        output = {},
        i;

    try {
      _.extend(output, url.parse(req.url, true).query,  req.params, req.body);
    } catch (err) {
      log(err);
    }

    reURL.lastIndex = 0;
    values = reURL.exec(req.url.toString());
    values.shift();
    keys = getKeys(urlFormat);
    count = Math.min(keys.length, values.length);

    for (i = 0; i < count; i++) {
      output[keys[i]] = values[i];
    }

    return output;
  }

  function addObjectSizes(data) {
    Object.keys(data).forEach(function perKey(key) {
      var value = data[key];

      if (value !== null && value !== undefined) {
        if (Array.isArray(data[key])) {
          data[key + 'Length'] = data[key].length;
        } else if (typeof data[key] === 'object' && key !== 'error') {
          data[key + 'Size'] = Object.keys(data[key]).length;
        }
      }
    });
  }

  function write(res, startTime, data) {
    if (data === undefined || data === null) {
      res.end();

      return;
    } else if (data instanceof Error) {
      res.status(data.status ? data.status : 500).end(JSON.stringify({ message: data.message, details: data.details }));

      return;
    } else if (data._file !== undefined) {
      res.writeHead(200, { 'Content-Type': data._file });
      res.end(data.content, 'binary');
    } else if (data._redirect !== undefined) {
      res.writeHead(302, { Location: data._redirect });
      res.end();
    } else {
      if (data._status !== undefined) {
        res.status(data._status);
      }

      if (typeof data !== 'object') {
        data = { result: data };
      }

      addObjectSizes(data);
      data.processTime = (new Date() - startTime) / 1000;
      res.end(data ? JSON.stringify(data) : '');
    }
  }

  function getAuthToken(req) {
    return {
      localIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      serverIP: config('ipAddress') + ':' + config('port')
    };
  }

  function getURLPattern(url, parametersMeta) {
    var item,
        actually,
        key;

    while ((item = urlParameterPattern.exec(url)) !== null) {
      if (parametersMeta === undefined) {
        throw Errors.badInput(url, item[1]);
      }

      key = parametersMeta[item[1]];

      if (Array.isArray(key)) {
        actually = '([' + key.join('|') + ']+)';
      } else {
        switch (key) {
          case 'id':
            actually = idPattern;
            break;
          case 'email':
            actually = emailPattern;
            break;
          case 'string':
            actually = '(.+)';
            break;
          case 'integer':
            actually = '(\\d+)';
            break;
          default:
            throw Errors.badInput(url, key);
        }
      }

      url = url.split(item[0]).join(actually);
    }

    return new RegExp('^' + apiUrlPrefix + url + '\\/?$');
  }

  module.exports = function ContextTemplate(url, def, FileManager, Mailer) {
      var action = def.handler,
          urlParameters = def.parameters,
          urlPattern = getURLPattern(url, urlParameters),
          parameters = action.toString().match(/^function\s?[^\(]+\s?\(([^\)]+)\)+/),
          parameterCount,
          context;

      parameters = (parameters !== null) ? parameters[1].replace(/\s/g, '').split(',') : [];
      parameterCount = parameters.length;

      context = function Context(req, res) {
        var args = [],
            input = read(req, url, urlPattern),
            value,
            settings,
            isHandlerAsync = false,
            authorizationProblem = false,

            writeToRes = write.bind({}, res, new Date());

        try {
          parameters.forEach(function perParameter(parameter) {
            var token;

            value = input[parameter];
            settings = urlParameters ? urlParameters[parameter] : false;

            if (value === undefined) {
              switch (parameter) {
                case 'callback':
                  value = writeToRes;
                  isHandlerAsync = true;
                  break;
                case 'db':
                  value = req.models;
                  break;
                case 'authToken':
                  value = getAuthToken(req);
                  break;
                case 'authUser':
                  if (req.headers.authorization === undefined) {
                    authorizationProblem = true;

                    return;
                  }

                  try {
                    value = JSON.parse(Encryption.decode(req.headers.authorization));
                  } catch (err) {
                    authorizationProblem = true;

                    return;
                  }

                  if (value.expires instanceof Date && value.expires < (new Date())) {
                    authorizationProblem = true;

                    return;
                  }

                  token = getAuthToken(req);

                  if (token.localIP !== value.localIP || token.serverIP !== value.serverIP) {
                    writeToRes(Errors.unauthorized());
                    authorizationProblem = true;

                    return;
                  }

                  value = value.user;
                  break;
                case 'optionalUser':
                  try {
                    value = JSON.parse(Encryption.decode(req.headers.authorization)).user;
                  } catch (err) {
                    value = undefined;
                  }

                  break;
                case 'isReturnJson':
                  value = (req.get('accept').indexOf('json') !== -1);
                  break;
                case 'files':
                  value = FileManager;
                  break;
                case 'mailer':
                  value = Mailer;
                  break;
              }
            }

            if (settings !== undefined) {
              if (settings.alias !== undefined) {
                value = input[settings.alias];
              }

              if (settings.value !== undefined) {
                value = settings.value;
              }
            }

            args.push(value);
          });

          if (authorizationProblem) {
            writeToRes(Errors.unauthorized());

            return;
          }

          try {
            value = action.apply(this, args);
          } catch (err) {
            log(err);
            writeToRes(Errors.systemError(err, args, req.url));

            return false;
          }

          if (!isHandlerAsync) {
            writeToRes(value);
          } else {
            return value;
          }
        } catch (err) {
          err.details = {
            args: args,
            url: req.method + ':' + req.url,
            message: err.message
          };
          log(''.concat('error in URL ', res.req.method, ':', res.req.url));
          log(err, 'fatal');

          try {
            writeToRes(err);
          }
          catch (err) {
            try {
              log('failed to use writeToRes');
              res.status(500).end(err);
            }
            catch (err) {
              log('failed to send any response', 'fatal');
            }
          }

          return false;
        }
      };

      context.getURL = function getURL() {
        return urlPattern;
      };

      return context;
    };
})();
