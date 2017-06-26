'use strict';

var WebSocket = require('ws');
var CallApi = require('./lib/callApi.js');
const WebSocketServer = WebSocket.Server;

const wss = new WebSocketServer({
    port: 9090
});
var channelId;

wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`);
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        channelId = JSON.parse(message).channelId;
        ws.send(`ECHO: ${message}`, (err) => {
            if (err) {
                console.log(`[SERVER] error: ${err}`);
            } else {
                var myInterval = setInterval(function () {
                    CallApi.callApi(channelId, function (json) {
                        ws.send(JSON.stringify(json), (err) => {
                            console.log(`[SERVER] error: ${err}`);                            
                        });
                    });
                }, 1000);
            }
        });
    });
});