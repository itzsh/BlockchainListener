'use strict';

var WebSocket = require('ws');
var log4js = require('log4js');
var CallApi = require('./lib/callApi.js');
const WebSocketServer = WebSocket.Server;
var channelId;
//配置log4js，配置两种选择，一种直接输出到控制台，一种打印到文本
log4js.configure({
    appenders: [{
            type: 'console',
            category: 'console'
        },
        {
            type: 'file',
            filename: './log/app.log',
            category: 'appLogs'
        }
    ],
    "replaceConsole": true,
    "levels": {
        "appLogs": "error",
        "console": "debug"
    }
});

const logger = log4js.getLogger('console');
const wss = new WebSocketServer({
    host: 'localhost',
    port: 9527,
    //verifyClient: socketverify
});

function socketverify(info) {
    //做一些事情来验证连接合法性，如果允许连接则return true，否则return false
    var origin = info.origin.match(/^(:?.+\:\/\/)([^\/]+)/);
    if (origin.length >= 3 && origin[2] == "localhost:9527") {
        return true;
    }
    return false;
}

wss.on('connection', function (ws) {
    logger.info(`[SERVER] connection()`);
    ws.on('message', function (message) {
        logger.info(`[SERVER] Received: ${message}`);
        try {
            channelId = JSON.parse(message).channelId;
        } catch (e) {
            logger.error(e);
            return;
        }

        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                logger.error(`[SERVER] error: ${err}`);
            } else {
                //每秒循环一次所有的接口查询
                var myInterval = setInterval(function () {
                    // logger.debug("start call api");
                    //调用函数来查询各个接口，如有变化，则返回数据
                    CallApi.callApi(channelId, function (json) {
                        logger.info('app get: ' + JSON.stringify(json));
                        // ws.send(JSON.stringify(json), (err) => {
                        //     logger.error(`[SERVER] error: ${err}`);
                        // });
                    });
                }, 2000);
            }
        });
    });
});

logger.info('Listening on http://localhost:9527');