'use strict';
var http = require("http");

// var timer = setInterval(function () {
//     console.log('This is a test.');
// }, 1000);
var post_data = {
    channelId:"ProdChannel1",
    timeStart: '20170629160151',
    timeEnd: '20170629170151',
    interval: 60
}
var data = '';
post_data = JSON.stringify(post_data);

var Request = function () {
    var options = {
        host: '172.25.50.215',
        port: 8765,
        method: 'post',
        path: '/bc_explorer/loan/getBlockCount',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    }

    var req = http.request(options, function (res) {
        res.setEncoding("utf-8");
        res.on("data", function (chunk) {
            data += chunk;
        });
        res.on("end", function () {
            //console.log(data);
            var json = JSON.parse(data);
            if (json.code == 'CF0000') {
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

Request();