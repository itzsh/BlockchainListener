'use strict';
var http = require("http");
var log4js = require('log4js');

log4js.configure({
    appenders: [{
            type: 'console',
            category: 'console'
        },
        {
            type: 'file',
            filename: './log/callapi.log',
            category: 'apiLogs'
        }
    ],
    "replaceConsole": true,
    "levels": {
        "apiLogs": "error",
        "console": "debug"
    }
});

const logger = log4js.getLogger('console');
var blockHeight = 0;
var totalTxNum = 0;
var blockNum = 0;
var txNum = 0;
var txPerBlock = 0;
var url = [
    '/bc_explorer/loan/getBlockHeight',
    '/bc_explorer/loan/getTotalTxNum',
    '/bc_explorer/loan/getBlockCount',
    '/bc_explorer/loan/getTxCount',
    '/bc_explorer/loan/getAvgTxPerBlock'
]

/**
 * 发起POST请求，得到数据，解析并返回
 * @param {*} path 
 * @param {*} post_data 
 * @param {*} callback 
 */
var Request = function (path, post_data, callback) {
    var data = '';
    var options = {
        host: '172.25.50.215',
        port: 8765,
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
            var json;
            try {
                //logger.info('data is '+ data);
                json = JSON.parse(data);
            } catch (e) {
                logger.error(e);
                json = {
                    code: 'BC0001',
                    msg: '返回结果无法解析'
                }
            }
            callback(json);
        });
    });

    req.on("error", function (err) {
        logger.error(err.message);
    });
    req.write(post_data);
    req.end();
}

//时间格式转换，转换成‘yyMMddhhmmss’
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
        var num = 0;
        var timeStart = dateFormat(Date.now() - 3601000);
        var timeEnd = dateFormat(Date.now()-1000);
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

        //通过递归来实现各个接口的依次查询
        var processItems = function (i) {
            if (i < url.length) {
                Request(url[i], JSON.stringify(pars[i]), function (json) {
                    //如果成功就判断处理
                    if (json.code === 'CF0000') {
                        switch (i) {
                            case 0:
                                num = json.blockHeight;
                                if (blockHeight != num) {
                                    blockHeight = num;
                                    callback(json);
                                }
                                break;
                            case 1:
                                num = json.totalTxNum;
                                if (totalTxNum != num) {
                                    totalTxNum = num;
                                    callback(json);
                                }
                                break;
                            case 2:
                                if (json.length >= 1) {
                                    num = json.blockCounts[0].blockNum;
                                    if (blockNum != num) {
                                        blockNum = num;
                                        callback(json);
                                    }
                                }
                                break;
                            case 3:
                                if (json.length >= 1) {
                                    num = json.txCounts[0].txNum;
                                    if (txNum != num) {
                                        txNum = num;
                                        callback(json);
                                    }
                                }
                                break;
                            case 4:
                                if (json.length >= 1) {
                                    num = json.avgTxPerBlocks[0].txPerBlock;
                                    if (txPerBlock != num) {
                                        txPerBlock = num;
                                        callback(json);
                                    }
                                }
                                break;
                        }
                    } else {
                        logger.warn(json.msg);
                    }

                    processItems(i + 1);
                });
            }
        };

        processItems(0);
    }
}

module.exports = CallApi;