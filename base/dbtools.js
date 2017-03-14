var dbhelper =require('andon-bluetooth-database');

/**
 * 新增扫描记录
 * @param args
 */
exports.insertdb = function (args) {
    dbhelper.insertMongo('BtConnectTimers', args, function (result) {
        if (result === "ok") {
            console.log("新增连接记录成功！")
        }
        else {
            console.log("新增连接记录失败，原因：" + result);
        }
    });
}

/**
 * 更新最新一条连接记录
 * @param callback
 */
exports.updatalastdb = function (args) {
    dbhelper.updataMongo('BtConnectTimers', {"time": args["time"]}, {$set: {"ble_down": args["ble_down"]}}, function (result) {
        if (result === "ok") {
            console.log("更新最新一条连接记录成功！")
        }
        else {
            console.log("更新最新一条连接记录失败，原因：" + result);
        }
    });
}

/**
 *查询handle
 * @param callback
 */
exports.selecthandledb = function (callback) {
    dbhelper.selectMongo('BleCookie', {"name": "defaulthandle"},{}, function (result) {
        callback(result);
        console.log("查询handle成功！")
    });
}

/**
 * 新增统计记录
 * @param args
 */
exports.insertCountdb = function (args) {
    dbhelper.insertMongo('BtConnectCount', args, function (result) {
        if (result === "ok") {
            console.log("新增统计记录成功！")
        }
        else {
            console.log("新增统计记录失败，原因：" + result);
        }
    });
}

/**
 *查询count
 * @param callback
 */
exports.selectCountdb = function (args, callback) {
    dbhelper.selectMongo('BtConnectCount', args,{}, function (result) {
        callback(result);
        console.log("查询count成功！")
    });
}

/**
 * 更新count
 * @param args
 */
exports.updataCountdb = function (args) {
    var set = "";
    switch (args["set"]) {
        case "normalDisconSum":
            set = {"normalDisconSum": 1};
            break;
        case "conFai":
            set = {"conFai": 1};
            break;
        case "disconSuc":
            set = {"disconSuc": 1};
            break;
        case "disconFai":
            set = {"disconFai": 1};
            break;
        case "unormalDisconSum":
            set = {"unormalDisconSum": 1};
            break;
        case "hciDeviceFailNum":
            set = {"hciDeviceFailNum": 1};
            break;
        case "conSuc":
            set = {"conSuc": 1};
            break;
    }
    dbhelper.updataMongo('BtConnectCount', {"mac": args["mac"]}, {"$inc": set}, function (result) {
        if (result === "ok") {
            console.log("更新count成功！")
        }
        else {
            console.log("更新count失败，原因：" + result);
        }
    });
}


/**
 * 新增扫描设备，存入缓存
 * @param args
 */
exports.insertDeviceInfodb = function (args) {
    dbhelper.insertMongo('BtDeviceInfo', args, function (result) {
        if (result === "ok") {
            console.log("新增扫描设备成功！")
        }
        else {
            console.log("新增扫描设备失败，原因：" + result);
        }
    });
}

/**
 * 更新统计数据
 * @param args
 */
exports.updateStatisticsdb = function (args) {
    var data = [args];
    dbhelper.updateMongoWithOption('BtConnectStatistics', {"mac": data[0]["mac"],
        "flag":data[0]["flag"],
        "mi":data[0]["mi"],
        "mobile":data[0]["mobile"],
        "name":data[0]["name"],
    }, {$inc: data[0]["inc"]},{upsert:true}, function (result) {
        if (result === "ok") {
            console.log("更新统计信息成功！")
        }
        else {
            console.log("更新统计信息失败，原因：" + result);
        }
    });
}


