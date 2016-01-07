;(function ContextClosure() {
    'use strict';

    var _ = require('underscore');
    var config = require('../helpers/config.js');
    var Encryption = require ('../helpers/Encryption.js');
    var log = require('../helpers/logger.js');
    var url = require('url');
    var errorCodes = {
        400: 'bad-request',
        401: 'unauthorized',
        403: 'forbidden',
        404: 'not-found',
        409: 'conflict'
    };

    function read(req) {
        var output = {};
        try {
            _.extend(output, url.parse(req.url, true).query,  req.params, req.body);
        } catch (err) {
            log(err);
        }
        return output;
    }

    function write(res, data) {
        if (data instanceof Error) {
            if (typeof data.details !== undefined) {
                log(JSON.stringify(data.details,null,4));
            }
            var errorMessage = errorCodes[data.message];
            if (errorMessage === undefined) {
                errorMessage = data.message;
                data = {message:500};
            }
            res.status(data.message).end(errorMessage);
        } else {
            res.end(JSON.stringify(data));
        }
    }

    function getAuthToken (req) {
        return {
            localIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            serverIP: config("ipAddress") + ':' + config("port")
        };
    }

    module.exports = function ContextTemplate(action, parameterSettings) {
            var parameters = action.toString().match(/^function\s?[^\(]+\s?\(([^\)]+)\)+/),
                parameterCount;
            parameters = (parameters !== null) ? parameters[1].replace(/\s/g, '').split(',') : [];
            parameterCount = parameters.length;

            return function Context(req, res, next) {
                var args = [];
                var input = read(req);
                var i;
                var parameter;
                var value;
                var settings;
                var isHandlerAsync = false;

                var writeToRes = function writeToResponse(value) {
                    write(res, value);
                };

                try {
                    for (i = 0; i < parameterCount; i += 1) {
                        parameter = parameters[i];
                        value = input[parameter];
                        settings = parameterSettings ? parameterSettings[parameter] : false;

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
                                    throw new Error(401);
                                }
                                if (value.expires instanceof Date && value.expires < (new Date())) {
                                    throw new Error(401);
                                }
                                var token = getAuthToken(req);
                                if (token.localIP !== value.localIP || token.serverIP !== value.serverIP) {
                                    throw new Error(401);
                                }
                                value = value.user;
                                break;
                            case 'isReturnJson':
                                value = (req.get("accept").indexOf("json") !== -1);
                                break;
                            }
                        }
                        if (settings !== undefined) {
                            if (settings.alias !== undefined) {
                                value = input[settings.alias];
                            }
                        }
                        args.push(value);
                    }


                    try {
                        value = action.apply(this, args);
                    } catch (err) {
                        err.details = {
                            args: args,
                            url: req.url,
                            message: err.message
                        };
                        writeToRes(err);
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
                    writeToRes(err);
                    return false;
                }
            };
        };
})();