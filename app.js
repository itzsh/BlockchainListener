'use strict';

var WebSocket = require('ws');
var log4js = require('log4js');
var CallApi = require('./lib/callApi.js');
const WebSocketServer = WebSocket.Server;
var channelId;

log4js.configure({
    appenders: {
        console: {
            type: 'console'
        },
        appLogs: {
            type: 'file',
            filename: './log/app.log'
        }
    },
    categories: {
        default: {
            appenders: ['console'],
            level: 'debug'
        },
        app: {
            appenders: ['appLogs'],
            level: 'error'
        }
    }
});

const logger = log4js.getLogger('console');
const wss = new WebSocketServer({
    host: 'localhost',
    port: 9527
    //verifyClient: socketverify
});

function socketverify(info) {
    logger.info('info : ' + JSON.stringify(info));
    //做一些事情来验证连接合法性，如果允许连接则return true，否则return false
    var origin = info.origin.match(/^(:?.+\:\/\/)([^\/]+)/);
    if (origin.length >= 3 && origin[2] == "localhost") {
        return true;
    }
    return false;
}

wss.on('connection', function (ws) {
    logger.info(`[SERVER] connection()`);
    ws.on('message', function (message) {
        logger.info(`[SERVER] Received: ${message}`);
        channelId = JSON.parse(message).channelId;
        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                logger.error(`[SERVER] error: ${err}`);
            } else {
                var myInterval = setInterval(function () {
                    CallApi.callApi(channelId, function (json) {
                        logger.info(JSON.stringify(json));
                        ws.send(JSON.stringify(json), (err) => {
                            logger.error(`[SERVER] error: ${err}`);
                        });
                    });
                }, 1000);
            }
        });
    });
});

logger.info('Listening on http://localhost:9527');