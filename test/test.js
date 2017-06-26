'use strict';
var http = require("http");

// var timer = setInterval(function () {
//     console.log('This is a test.');
// }, 1000);
var post_data = {
    channelId : 0
}

var Request = function () {
    var options = {
        host: '172.25.50.214',
        port: 8080,
        method: 'post',
        path: '/loan/getBlockHeight',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
        }
    }

    var req = http.request(options, function (res) {
        res.setEncoding("utf-8");
        res.on("data", function (chunk) {
            data += chunk;
        });
        res.on("end", function () {
            var json = JSON.parse(data);
            if (json.Code == 'CF0000') {
                console.log(json);
            } else {
                console.log(json.msg);
            }
        });
    });

    req.on("error", function (err) {
        console.log(err.message);
    });
    req.write(post_data);
    req.end();
}