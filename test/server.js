'use strict';
var http = require("http");
var postArg = '';
var res = {
    code: 'CF0000',
    msg: 'success',
    blockHeight: 10
}
http.createServer(function (request, response) {
    request.on('data', function (chunk) {
        postArg += chunk;
    });

    request.on('end', function () {
        //console.log("Received POST data:" + postArg);        
        var postArg_json = JSON.parse(postArg);
        var channelId = postArg_json.channelId;
        console.log("request channelId:" + channelId);
    });

    response.writeHead(200, {
        'Content-Type': 'application/json'
    });
    response.write(JSON.stringify(res));
    response.end();
}).listen(8080);

console.log("Server listen on port : 8080!!");