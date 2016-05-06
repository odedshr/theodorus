;(function ContextClosure() {
  'use strict';

  var _ = require('underscore');
  var url = require('url');

  var config = require('../helpers/config.js');
  var Encryption = require ('../helpers/Encryption.js');
  var Errors = require('../helpers/Errors.js');
  var log = require('../helpers/logger.js');

  var validators = require('../helpers/validators.js');
  var urlParameterPattern = validators.urlParameterPattern;
  var idPattern = validators.maskedIdPattern;
  var emailPattern = validators.emailPatternString;

  function getKeys (urlFormat) {
    var matches, keys = [];
    urlParameterPattern.lastIndex = 0;
    while ((matches = urlParameterPattern.exec(urlFormat)) !== null) {
      keys[keys.length] = matches[1];
    }
    return keys;
  }
  function read(req, urlFormat, reURL) {
    var keys, values, count, output = {};
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
    for (var i=0; i < count ;i++) {
      output[keys[i]] = values[i];
    }

    return output;
  }

  function addObjectSizes (data) {
    var keys = Object.keys(data);
    var keyCount = keys.length;
    while (keyCount--) {
      var key = keys[keyCount];
      var value = data[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(data[key])) {
          data[key+'Length'] = data[key].length;
        } else if (typeof data[key] === 'object' && key !== 'error') {
          data[key+'Size'] = Object.keys(data[key]).length;
        }
      }
    }
  }

  function write (res, startTime, data) {
    if (data === undefined || data === null) {
      res.end();
      return;
    } else if (data instanceof Error) {
      res.status(data.status ? data.status : 500).end(JSON.stringify({ message: data.message, details: data.details}));
      return;
    } else if (data._file !== undefined) {
      res.writeHead(200, {'Content-Type': data._file });
      res.end(data.content, 'binary');
    } else if (data._redirect !== undefined) {
      res.writeHead(302, { 'Location': data._redirect });
      res.end();
    } else {
      if (data._status !== undefined) {
        res.status(data._status);
      }

      if (typeof data !== 'object') {
        data = {'result' : data };
      }
      addObjectSizes(data);
      data.processTime = (new Date() - startTime)/1000;
      res.end(data ? JSON.stringify(data) : '');
    }
  }

  function getAuthToken (req) {
    return {
      localIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      serverIP: config("ipAddress") + ':' + config("port")
    };
  }

  function getURLPattern (url, parametersMeta) {
    var item;
    while ((item = urlParameterPattern.exec(url)) !== null) {
      if (parametersMeta === undefined) {
        throw Errors.badInput(url,item[1]);
      }
      var actually;
      var key = parametersMeta[item[1]];
      if (Array.isArray(key)) {
        actually ='(['+key.join('|')+']+)';
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
          default:
            throw Errors.badInput(url,key);
        }
      }
      url = url.split(item[0]).join( actually );
    }
    return new RegExp ('^' + url + '\\/?$');
  }

  module.exports = function ContextTemplate(url, def, FileManager, Mailer) {
      var action = def.handler;
      var urlParameters = def.parameters;
      var urlPattern = getURLPattern(url, urlParameters);
      var parameters = action.toString().match(/^function\s?[^\(]+\s?\(([^\)]+)\)+/);
      parameters = (parameters !== null) ? parameters[1].replace(/\s/g, '').split(',') : [];
      var parameterCount = parameters.length;

      var context = function Context(req, res) {
        var args = [];
        var input = read(req, url, urlPattern);
        var i;
        var parameter;
        var value;
        var settings;
        var isHandlerAsync = false;

        var writeToRes = write.bind({}, res, new Date());

        try {
          for (i = 0; i < parameterCount; i += 1) {
            parameter = parameters[i];
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
                try {
                  value = JSON.parse(Encryption.decode(req.headers.authorization));
                } catch (err) {
                  writeToRes (Errors.unauthorized());
                  return;
                }
                if (value.expires instanceof Date && value.expires < (new Date())) {
                  writeToRes (Errors.unauthorized());
                  return;
                }
                var token = getAuthToken(req);
                if (token.localIP !== value.localIP || token.serverIP !== value.serverIP) {
                  writeToRes (Errors.unauthorized());
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
                value = (req.get("accept").indexOf("json") !== -1);
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
            url: req.method+':'+req.url,
            message: err.message
          };
          log (''.concat('error in URL ' ,res.req.method, ':', res.req.url));
          log (err, 'fatal');

          try {
            writeToRes(err);
          }
          catch (err) {
            try {
              log('failed to use writeToRes');
              res.status(500).end(err);
            }
            catch (err) {
              log('failed to send any response','fatal');
            }
          }
          return false;
        }
      };

      context.getURL = function getURL () {
        return urlPattern;
      };
      return context;
    };
})();