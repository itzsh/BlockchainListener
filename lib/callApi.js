'use strict';
var http = require("http");
var Thenjs = require('thenjs');
var log4js = require('log4js');
var config = require('../config/config.js');
log4js.configure(config.apiConfig);

const logger = log4js.getLogger('console');
var blockHeight = 0;
var totalTxNum = 0;
var blockNum = 0;
var txNum = 0;
var txPerBlock = 0;
var pendingTxNum = 0;
var totalNode = 0;
var activeNode = 0;
var activeTime = parseInt(Date.now() / 1000);

var url = [
    '/bc_explorer/loan/getBlockHeight',
    '/bc_explorer/loan/getTotalTxNum',
    '/bc_explorer/loan/getBlockCount',
    '/bc_explorer/loan/getTxCount',
    '/bc_explorer/loan/getAvgTxPerBlock',
    '/bc_explorer/loan/getPendingTxCount'
]

var ucloud = [
    'http://api.ucloud.cn/?Action=DescribeUHostInstance&Region=cn-bj2&Zone=cn-bj2-02&UHostIds.0=uhost-bwoipu&UHostIds.1=uhost-f1rubi&UHostIds.2=uhost-gw4ycp&UHostIds.3=uhost-sf1oou&Offset=0&Limit=20&PublicKey=Ws7IXvUEnS0FTT1bxk83TGiVo1L3iuJ5gyFGEK/jwKDbP/TskAMgAA==&Signature=c1e2ffe175efa8584e0be34e35f869db57d8a60e',
    'http://api.ucloud.cn/?Action=DescribeUHostInstance&Region=cn-bj2&Zone=cn-bj2-02&UHostIds.0=uhost-b0djf3&Offset=0&Limit=20&PublicKey=Ws7IXvUEnS0FTT1bxk83TGiVo1L3iuJ5gyFGEK/jwKDbP/TskAMgAA==&ProjectId=org-zciif2&Signature=dfcfb1a603fd2a5e240a3f1b6f47f38d7f120374',
    'http://api.ucloud.cn/?Action=DescribeUHostInstance&Region=cn-bj2&Zone=cn-bj2-02&UHostIds.0=uhost-pgltaf&Offset=0&Limit=20&PublicKey=Ws7IXvUEnS0FTT1bxk83TGiVo1L3iuJ5gyFGEK/jwKDbP/TskAMgAA==&ProjectId=org-sg2jvd&Signature=77646ac8759482114a023717ad5d89ff81d80647'
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
            var json;
            try {
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

/**
 * Get方法，获取json数据
 * @param {string} path url路径
 * @param {*} callback 
 */
var Get = function (path, callback) {
    http.get(path, (res) => {
        const {
            statusCode
        } = res;
        const contentType = res.headers['content-type'];

        let error;
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                `Expected application/json but received ${contentType}`);
        }
        if (error) {
            logger.error(error.message);
            // consume response data to free up memory
            res.resume();
            return;
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                const parsedData = JSON.parse(rawData);
                callback(null, parsedData);
                // logger.info(parsedData);
            } catch (e) {
                logger.error(e.message);
            }
        });
    }).on('error', (e) => {
        logger.error(`Got error: ${e.message}`);
    });
}

//时间格式转换，转换成'yyMMddhhmmss'
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
    getBlockInfo: function (channelId, callback) {
        var num = 0;
        let timeStart = dateFormat(Date.now() - 3601000); //由于服务器系统时差问题，延时一秒
        let timeEnd = dateFormat(Date.now() - 1000); //同上
        let intervalH = 60; //单位分钟
        let intervalM = 1; //未处理交易数，时间取一分钟
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
                interval: intervalH
            },
            {
                channelId: channelId,
                timeStart: timeStart,
                timeEnd: timeEnd,
                interval: intervalH
            },
            {
                channelId: channelId,
                timeStart: timeStart,
                timeEnd: timeEnd,
                interval: intervalH
            },
            {
                channelId: channelId,
                timeStart: timeStart,
                timeEnd: timeEnd,
                interval: intervalM
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
                                    callback({
                                        api: 'getBlockHeight',
                                        msg: json
                                    });
                                }
                                break;
                            case 1:
                                num = json.totalTxNum;
                                if (totalTxNum != num) {
                                    totalTxNum = num;
                                    callback({
                                        api: 'getTotalTxNum',
                                        msg: json
                                    });
                                }
                                break;
                            case 2:
                                if (json.blockCounts.length >= 1) {
                                    num = json.blockCounts[0].blockNum;
                                    if (blockNum != num) {
                                        blockNum = num;
                                        callback({
                                            api: 'getBlockCount',
                                            msg: json
                                        });
                                    }
                                }
                                break;
                            case 3:
                                if (json.txCounts.length >= 1) {
                                    num = json.txCounts[0].txNum;
                                    if (txNum != num) {
                                        txNum = num;
                                        callback({
                                            api: 'getTxCount',
                                            msg: json
                                        });
                                    }
                                }
                                break;
                            case 4:
                                if (json.avgTxPerBlocks.length >= 1) {
                                    num = json.avgTxPerBlocks[0].txPerBlock;
                                    if (txPerBlock != num) {
                                        txPerBlock = num;
                                        callback({
                                            api: 'getAvgTxPerBlock',
                                            msg: json
                                        });
                                    }
                                }
                                break;
                            case 5:
                                if (json.pendingTxCounts.length >= 1) {
                                    num = json.pendingTxCounts[0].pendingTxNum;
                                    if (pendingTxNum != num) {
                                        pendingTxNum = num;
                                        callback({
                                            api: 'getPendingTxCount',
                                            msg: json
                                        });
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
    },

    getNodeInfo: function (callback) {
        //定义变量来存上一次的节点信息
        // var o_totalNode = totalNode;
        // var o_activeNode = activeNode;
        // var o_activeTime = activeTime;
        //采用了Thenjs来保证任务的串行
        Thenjs(function (cont) {
            totalNode = 0;
            activeNode = 0;
            activeTime = parseInt(Date.now() / 1000);
            cont();
        }).each(ucloud, function (cont, path) {
            //循环云主机Url,获取节点信息
            Thenjs(function (cont2) {
                Get(path, cont2);
            }).then(function (cont2, json) {
                if (json.RetCode == 0) {
                    var uHostSet = json.UHostSet;
                    totalNode += json.TotalCount;
                    cont2(null, uHostSet);
                } else {
                    cont2(null, []);
                }
            }).then(function (cont2, uHostSet) {
                //循环每一个主机上的节点信息
                Thenjs.each(uHostSet, function (cont3, e) {
                    if (e.State == 'Running') {
                        activeNode++;
                        //取创建时间最早的来计算活跃时长
                        if (e.CreateTime < activeTime) {
                            activeTime = e.CreateTime;
                        }
                    }
                    cont3();
                }).then(function (cont3) {
                    cont2();
                });
            }).then(function (cont2) {
                cont();
            }).fail(function (cont2, error) {
                logger.error(error);
            });
        }).then(function (cont, result) {
            //当三个变量中任意一个变化时，返回信息到前端
            // if (o_activeNode != activeNode || o_totalNode != totalNode || o_activeTime != activeTime) {
            //     o_totalNode = totalNode;
            //     o_activeNode = activeNode;
            //     o_activeTime = activeTime;
            callback({
                api: 'getNodeInfo',
                msg: {
                    activeNode: activeNode.toString() + '/' + totalNode.toString(),
                    activeTime: parseInt(Date.now() / 1000) - activeTime
                }
            });
            // }
        }).fail(function (cont, error) {
            logger.error(error);
        });
    }
}

module.exports = CallApi;