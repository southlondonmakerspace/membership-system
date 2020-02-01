var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var config = require( __config + '/config.json' );
var request = require('request');
/**
 * Proxy requests to another system that validates tags
 */

// this dictionary maps the old permission 'slugs' to group IDs in the new system

var slugToToolNumber = {
    'door': 2,
    'shutter': 22
};

module.exports = {
    validate: function (config, callback) {
        var toolId = slugToToolNumber[config.slug];
        if (toolId === undefined) {
            callback(`Tool ID is not mapped`, null);
            return;
        }
        request({
            uri: config.url,
            method: 'POST',
            json: true,
            postData: {
                mimeType: 'application/x-www-form-urlencoded',
                params: [
                    {
                        name: 'tag_hashed',
                        value: config.tag
                    },
                    {
                        name: 'toolId',
                        value: toolId
                    },
                    {
                        name: 'espid',
                        value: 'SLMS-LegacyAPI'
                    }
                ]
            }
         }, function (error, response, body) {
            if (error) {
                callback(`Request to external validator: ${error}`);
            } else {
                callback(null, {
                    member: body.userid,
                    permission: config.slug,
                    successful: (body.perm === 'APPROVE')
                });
            }
        });
    }
}