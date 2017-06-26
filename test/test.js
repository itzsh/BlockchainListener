'use strict';
var http = require("http");

// var timer = setInterval(function () {
//     console.log('This is a test.');
// }, 1000);
var post_data = {
    channelId:"ProdChannel1",
    timeStart:"20170619140000",
    timeEnd:"20170619150000",
    interval:60
}
var data = '';
post_data = JSON.stringify(post_data);

var Request = function () {
    var options = {
        host: '172.25.50.214',
        port: 8080,
        method: 'post',
        path: '/bs_platform/loan/getAvgTxPerBlock',
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
                console.log(json.avgTxPerBlocks[0].txPerBlock);
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