'use strict';
var http = require("http");

var blockHeight = 0;
var totalTxNum = 0;
var blockNum = 0;
var txNum = 0;
var txPerBlock = 0;
var data = '';
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
        host: '172.25.50.214',
        port: 8080,
        method: 'post',
        path: path,
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
            var json = JSON.parse(data);
            if (json.code == 'CF0000') {
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

//时间格式转换
var dateFormat = function (ms) {
    var d = new Date(ms);
    var pad = function (s) {
        if (s.toString().length == 1) {
            s = '0' + s;
        }
        return s;
    }

    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var date = d.getDate();

    var hour = d.getHours();
    var minute = d.getMinutes();
    var second = d.getSeconds();

    return year + pad(month) + pad(date) + pad(hour) + pad(minute) + pad(second);
}

//判断数据是否更新，有更新则保存，同时发送给前端
var CallApi = {
    callApi: function (channelId, callback) {
        RedisInit();
        var num = 0;
        var timeStart = dateFormat(Date.now() - 3600000);
        var timeEnd = dateFormat(Date.now());
        var interval = 60;
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
                        if (blockHeight != num) {
                            blockHeight = num;
                            callback(json);
                        }
                        break;
                    case 1:
                        num = json.totalTxNum.toString();
                        if (totalTxNum != num) {
                            totalTxNum = num;
                            callback(json);
                        }
                        break;
                    case 2:
                        num = json.blockNum.toString();
                        if (blockNum != num) {
                            blockNum = num;
                            callback(json);
                        }
                        break;
                    case 3:
                        num = json.txNum.toString();
                        if (txNum != num) {
                            txNum = num;
                            callback(json);
                        }
                        break;
                    case 4:
                        num = json.txPerBlock.toString();
                        if (txPerBlock != num) {
                            txPerBlock = num;
                            callback(json);
                        }
                        break;
                }
            });
        }
    }
}

module.exports = CallApi;