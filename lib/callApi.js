'use strict';
var http = require("http"),
    redis = require("redis");

var data = '';

var client = redis.createClient();
client.on("error", function (err) {
    console.log("Error " + err);
});

var url = [
    '/bs_platform/loan/getBlockHeight',
    '/bs_platform/loan/getTotalTxNum',
    '/bs_platform/loan/getBlockCount',
    '/bs_platform/loan/getTxCount',
    '/bs_platform/loan/getAvgTxPerBlock'
]

/**
 * 发起POST请求，得到数据，并将其保存
 * @param {*} path 
 * @param {*} post_data 
 * @param {*} callback 
 */
var Request = function (path, post_data, callback) {
    var options = {
        host: '',
        port: 80,
        method: 'post',
        path: path,
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
                callback(json);
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

//初始化Redis
var RedisInit = function () {
    client.set('blockHeight', 0);
    client.set('totalTxNum', 0);
    client.set('blockNum', 0);
    client.set('txNum', 0);
    client.set('txPerBlock', 0);
}

//判断并保存数据
var SavaData = function (key, value) {
    client.get(key, function (err, reply) {
        if (err) console.log(err);
        if (reply == value) {
            client.set(key, value);
            return true;
        } else {
            return false;
        }
    });
}

//判断数据是否更新，有更新则保存，同时发送给前端
var CallApi = {
    callApi: function (channelId, callback) {
        RedisInit();
        var num = 0;
        var timeStart = '';
        var timeEnd = '';
        var interval = '';
        var pars = [{
                channelId: channelId
            },
            {
                channelId: channelId
            },
            {
                channelId: channelId,
                timeStart: timeStart,
                timeEnd: timeEnd,
                interval: interval
            },
            {
                channelId: channelId,
                timeStart: timeStart,
                timeEnd: timeEnd,
                interval: interval
            },
            {
                channelId: channelId,
                timeStart: timeStart,
                timeEnd: timeEnd,
                interval: interval
            }
        ]


        for (var i = 0; i < url.length; i++) {
            Request(url[i], pars[i], function (json) {
                switch (i) {
                    case 0:
                        num = json.blockHeight.toString();
                        if (SavaData('blockHeight', num)) {
                                callback(json);                            
                        }
                        break;
                    case 1:
                        num = json.totalTxNum.toString();
                        if (SavaData('totalTxNum', num)) {
                                callback(json);                            
                        }
                        break;
                    case 2:
                        num = json.blockNum.toString();
                        if (SavaData('blockNum', num)) {
                                callback(json);                            
                        }
                        break;
                    case 3:
                        num = json.txNum.toString();
                        if (SavaData('txNum', num)) {
                                callback(json);                            
                        }
                        break;
                    case 4:
                        num = json.txPerBlock.toString();
                        if (SavaData('txPerBlock', num)) {
                                callback(json);                            
                        }
                        break;
                }
            });
        }
    }
}

module.exports = CallApi;