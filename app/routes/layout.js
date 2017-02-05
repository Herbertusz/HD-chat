/**
 *
 */

'use strict';

const ENV = require.main.require('../app/env.js');
const CHAT = require.main.require('../app/config.js');

module.exports = function(app){

    app.locals.CHAT = CHAT;
    app.locals.layout = {
        DOMAIN : ENV.DOMAIN,
        WSPORT : ENV.WSPORT,
        publicPath : app.get('public path'),
        menu : [
            {
                text : 'Főoldal',
                url : '/'
            },
            {
                text : 'Chat',
                url : '/chat'
            },
            {
                text : 'Iframe-Hörb',
                url : '/iframe/1'
            },
            {
                text : 'Iframe-Dan',
                url : '/iframe/2'
            },
            {
                text : 'Iframe-Pistike',
                url : '/iframe/3'
            },
            {
                text : 'Videochat',
                url : '/videochat'
            }
        ]
    };

};
