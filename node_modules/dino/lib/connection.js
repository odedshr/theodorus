var AWS = require('aws-sdk');

exports.client = new AWS.DynamoDB().client;

exports.create = function (options) {
    
    if (!options)
    {
        return new AWS.DynamoDB().client;
    }
    
    return new AWS.DynamoDB({
        credentials: options,
        region: options.region
    }).client;
};