/**
 * Created by Fwind on 2017/3/14.
 * Tianjin，ihealthlabs
 * 晴
 */
var dbtool = require('./base/dbtools');
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var BluetoothScanner = module.exports = function (option, callback) {
        var self = this;
        // Inherit EventEmitter
        EventEmitter.call(self);

        self.init = function (option) {
            console.log("connect index:" + JSON.stringify(option));
            //记录连接异常情况
            var hcidev = 'hci0';
            var macAddr = option['mac'];
            var mobile = option['mobile'];
            var devicename = option['name'];            //设备名称
            var mi = option['mi'];                      //测试距离
            var flag = option['flag'];                  //测试标记
            var record_time = new Date().getTime();     //记录时间
            var connect_time = 0;                       //连接时间
            var disconnect_time = 0;                    //断开时间
            var args = {};                              //初始化参数，获取途径：传入
            // 启动蓝牙适配器dongle
            var hciconfig = spawn('hciconfig', [hcidev, 'up']);
            hciconfig.on("exit", function (code) {
                    //启动蓝牙失败
                    if (code !== 0) {
                        console.log("hcitool Device " + hcidev + "up fail!");
                        //写入统计库
                        args = {
                            "mac": macAddr,
                            "flag": flag,
                            "mi": mi,
                            "mobile": mobile,
                            "name": devicename,
                            "inc": {
                                "deviceup_failed": 1
                            }
                        };
                        dbtool.updateStatisticsdb(args);
                        callback({"result": 0, "value": "蓝牙启动失败！"});
                    }
                    else {
                        console.log("Device " + hcidev + "up suceed!");
                        var begin_scan_time = new Date();
                        var end_scan_time = new Date();
                        var scan_time=0;
                        //扫描周围蓝牙
                        var hciToolScan = spawn('hcitool', ['scan']);
                        hciToolScan.stdout.on('data', function (data) {
                            console.log("scan data:"+data);
                            end_scan_time = new Date();
                            scan_time= end_scan_time.getTime()-begin_scan_time.getTime();
                            //扫描得到结果
                            if(data.indexOf(macAddr.toUpperCase())>0){
                                //begin Connect
                                var begin_time = new Date();
                                var end_time = new Date();
                                var hciToolcc = spawn('hcitool', ['cc', macAddr]);
                                console.log("扫描时间:" +scan_time);
                                console.log("hcitool cc: started..." + ['cc', macAddr]);
                                console.log("连接设备:" + macAddr);
                                //hciToolcc.stdout.on('data', function (data) {
                                //    console.log("data:"+data)
                                //});

                                hciToolcc.on("exit", function (code) {
                                    console.log("exit:" + code);
                                    if (code !== 0) {
                                        //第一次连接失败
                                        console.log("cc " + macAddr + " failed!");
                                        //第二次断开
                                        var hciTooldcSec = spawn('hcitool', ['dc', macAddr]);
                                        hciTooldcSec.on('exit', function (code) {
                                            if (code !== 0) {
                                                console.log("cc failed dc failed!");
                                                //写入统计库
                                                args = {
                                                    "mac": macAddr,
                                                    "flag": flag,
                                                    "mi": mi,
                                                    "mobile": mobile,
                                                    "name": devicename,
                                                    "inc": {
                                                        "cc_failed": 1,
                                                        "dc_failed": 1,
                                                        "dc_Twice": 1
                                                    }
                                                };
                                                dbtool.updateStatisticsdb(args);
                                            } else {
                                                console.log("cc failed dc succeed!");
                                                //写入统计库
                                                args = {
                                                    "mac": macAddr,
                                                    "flag": flag,
                                                    "mi": mi,
                                                    "mobile": mobile,
                                                    "name": devicename,
                                                    "inc": {
                                                        "cc_failed": 1,
                                                        "dc_failed": 1
                                                    }
                                                };
                                                dbtool.updateStatisticsdb(args);
                                            }
                                        });
                                        callback({"result": 0, "value": "失败！"});

                                        //记录只扫描不连接的次数
                                        args = {
                                            "mac": macAddr,
                                            "flag": flag,
                                            "name": devicename,
                                            "mi": mi,
                                            "time": record_time,
                                            "mobile": mobile,
                                            "isConnect": 0
                                        };
                                        dbtool.insertdb(args);
                                    }
                                    else {
                                        end_time = new Date();
                                        //console.log("连接成功!");
                                        console.log("设备名称:" + option['name'] + "|mac:" + option['mac']);
                                        connect_time = (end_time.getTime() - begin_time.getTime());
                                        console.log('\t' + "连接时间:" + connect_time + "ms");
                                        if(connect_time>10000)
                                        {
                                            console.log("cc failed!timeout!");
                                            //写入统计库
                                            args = {
                                                "mac": macAddr,
                                                "flag": flag,
                                                "mi": mi,
                                                "mobile": mobile,
                                                "name": devicename,
                                                "inc": {
                                                    "cc": 0
                                                }
                                            };
                                            dbtool.updateStatisticsdb(args);
                                            args = {
                                                "mac": macAddr,
                                                "ConnectionTime": connect_time,
                                                "DisconnectTime": disconnect_time,
                                                "flag": flag,
                                                "name": devicename,
                                                "mi": mi,
                                                "time": record_time,
                                                "mobile": mobile,
                                                "isConnect": 0
                                            };
                                            dbtool.insertdb(args);
                                            callback({
                                                "result": 0,
                                                "value": "失败！连接超时！"
                                            });
                                        }
                                        else{
                                            //data = data.toString('utf-8');
                                            var dcEndtime = new Date();
                                            //断开操作
                                            var hciTooldc = spawn('hcitool', ['dc', macAddr]);
                                            console.log("hcitooldc state:" + code);
                                            hciTooldc.on('exit', function (code) {
                                                disconnect_time = (new Date().getTime() - dcEndtime);
                                                //console.log("断开成功!");
                                                console.log('\t' + "断开时间:" + disconnect_time + "ms");

                                                if (code !== 0) {
                                                    console.log("cc succeed dc failed!");
                                                    //写入统计库
                                                    args = {
                                                        "mac": macAddr,
                                                        "flag": flag,
                                                        "mi": mi,
                                                        "mobile": mobile,
                                                        "name": devicename,
                                                        "inc": {
                                                            "dc_failed": 1,
                                                            "cc": 1
                                                        }
                                                    };
                                                    dbtool.updateStatisticsdb(args);
                                                } else {
                                                    console.log("cc succeed dc succeed!");
                                                    //写入统计库
                                                    args = {
                                                        "mac": macAddr,
                                                        "flag": flag,
                                                        "mi": mi,
                                                        "mobile": mobile,
                                                        "name": devicename,
                                                        "inc": {
                                                            "dc_success": 1,
                                                            "cc": 1
                                                        }
                                                    };
                                                    dbtool.updateStatisticsdb(args);
                                                }

                                                args = {
                                                    "mac": macAddr,
                                                    "ConnectionTime": connect_time,
                                                    "DisconnectTime": disconnect_time,
                                                    "flag": flag,
                                                    "name": devicename,
                                                    "mi": mi,
                                                    "time": record_time,
                                                    "mobile": mobile,
                                                    "isConnect": 1
                                                };
                                                dbtool.insertdb(args);
                                            });
                                            console.log("连接成功!");
                                            console.log('\t' + "连接成功退出时间:" + (new Date().getTime() - begin_time) + "ms");
                                            //返回成功结果
                                            callback({
                                                "result": 1,
                                                "value": "成功！扫描时间："+scan_time+"ms,连接时间：" + connect_time + "ms！"
                                            });
                                        }
                                    }

                                    var hciconfig = spawn('hciconfig', [hcidev, 'down']);
                                    hciconfig.on("exit", function (code) {
                                        if (code !== 0) {
                                            console.log("Device " + hcidev + "down failed!");
                                            //写入统计库
                                            args = {
                                                "mac": macAddr,
                                                "flag": flag,
                                                "mi": mi,
                                                "mobile": mobile,
                                                "name": devicename,
                                                "inc": {
                                                    "devicedown_failed": 1
                                                }
                                            };
                                            dbtool.updateStatisticsdb(args);
                                        }
                                        else {
                                            console.log("Device " + hcidev + "down succeed!");
                                            //写入统计库
                                            args = {
                                                "mac": macAddr,
                                                "flag": flag,
                                                "mi": mi,
                                                "mobile": mobile,
                                                "name": devicename,
                                                "inc": {
                                                    "devicedown_success": 1
                                                }
                                            };
                                            dbtool.updateStatisticsdb(args);
                                        }
                                        //callback({"result": 0, "value": "蓝牙断开失败！"});
                                    });
                                });
                            }else {
                                callback({"result": 0, "value": "无扫描结果！"});
                            }

                        });
                        hciToolScan.on("exit", function (code) {
                            console.log("hciToolScan exit:" + code);

                        })
                    }
                }
            );
        }
        ;
        self.init(option);
    }
    ;
util.inherits(BluetoothScanner, EventEmitter);
