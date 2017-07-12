'use strict';

var WebSocket = require('ws');
var log4js = require('log4js');
var config = require('./config/config.js');
var CallApi = require('./lib/callApi.js');
const WebSocketServer = WebSocket.Server;

// 配置log4js，配置两种选择，一种直接输出到控制台，一种打印到文本
log4js.configure(config.appConfig);

const logger = log4js.getLogger('console');
const wss = new WebSocketServer(config.wsConfig);

// 创建连接池
var clients = [];

wss.on('connection', (ws) => {
    // 将该连接加入连接池
    var channelId, sid, mid;
    clients.push(ws);

    logger.info(`[SERVER] connection()`);
    ws.on('message', (message) => {
        logger.info(`[SERVER] Received: ${message}`);
        // channelId是通过前端传过来的
        try {
            channelId = JSON.parse(message).channelId;
        } catch (e) {
            logger.error(e);
            return;
        }

        CallApi.getNodeInfo((json) => {
            logger.info('app get: ' + JSON.stringify(json));
            ws.send(JSON.stringify(json), (error) => {
                if (error) logger.warn(error);
                return;
            });
        });
    });

    // 保证只被调用一次
    if (clients.length == 1) {
        sid = setInterval(() => {
            // 调用函数来查询各个接口，如有变化，则返回数据
            CallApi.getBlockInfo(channelId, (json) => {
                logger.info('app get: ' + JSON.stringify(json));
                clients.forEach(function (socket) {
                    socket.send(JSON.stringify(json), (error) => {
                        if (error) logger.warn(error);
                        return;
                    });
                });
            });
        }, 2000);

        mid = setInterval(() => {
            // 调用函数来查询节点状态，如有变化，则返回数据
            CallApi.getNodeInfo((json) => {
                logger.info('app get: ' + JSON.stringify(json));
                clients.forEach(function (socket) {
                    socket.send(JSON.stringify(json), (error) => {
                        if (error) logger.warn(error);
                        return;
                    });
                });
            });
        }, 60000);
    }

    ws.on('close', () => {
        // 连接关闭时，将其移出连接池
        clients = clients.filter(function (socket) {
            return socket !== ws
        });
        // 当没有连接时，关闭定时查询
        if (clients == []) {
            clearInterval(sid);
            clearInterval(mid);
        }
    });
});

logger.info('Listening on port 8080');