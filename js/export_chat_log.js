"use strict";
// 把steamchatmessage转换为map
function ConvertSteamChatMessageToMap(v) {
    let mm = new Map();
    mm.set("SenderID", v.SenderID);
    mm.set("Sender", v.Sender);
    mm.set("RecipientID", v.RecipientID);
    mm.set("Recipient", v.Recipient);
    mm.set("Time", v.Time);
    mm.set("UTCTime", v.UTCTime);
    mm.set("Message", v.Message);
    return mm;
}
// 构造steam聊天记录的CSV文件
function BuildCSV(msg, num2str) {
    if (msg.length < 1) {
        return "";
    }
    let o = "";
    let first = msg[0];
    let map1 = ConvertSteamChatMessageToMap(first);
    let keys = GetMapKeys(map1);
    keys.forEach(function (kk) {
        if (o.length > 1) {
            o += ",";
        }
        o += kk;
    });
    msg.forEach(function (v) {
        o += "\n";
        let map2 = ConvertSteamChatMessageToMap(v);
        let str = "";
        let dt = new Date;
        let z = "0";
        dt.setTime(map2.get("UTCTime"));
        str = dt.getFullYear().toString().padStart(4, z) + "/" + (dt.getMonth() + 1).toString().padStart(2, z) + "/";
        str += dt.getDate().toString().padStart(2, z) + " " + (dt.getHours()).toString().padStart(2, z) + ":";
        str += (dt.getMinutes()).toString().padStart(2, z) + ":" + (dt.getSeconds)().toString().padStart(2, z);
        map2.set("Time", str);
        let line = "";
        keys.forEach(function (kk) {
            if (line.length > 2) {
                line += ",";
            }
            let v2 = map2.get(kk);
            if (v2 == null) {
                v2 = "null";
            }
            str = v2.toString();
            line += Quote(str, num2str);
        });
        o += line;
    });
    return o;
}
//构造steam聊天记录的JSON文件
function BuildJSON(msg) {
    let j = JSON.stringify(msg);
    return j;
}
let needRevokeID = 0;
let needRevokeURL = "";
browser.downloads.onChanged.addListener(function (cd) {
    let st = cd.state;
    if (st == null || st.current == null) {
        return;
    }
    if (st.current != "in_progress") {
        if (cd.id == needRevokeID) {
            URL.revokeObjectURL(needRevokeURL);
            console.log("释放了下载的缓存：", needRevokeID, needRevokeURL);
        }
    }
});
// 下载一个文本文件
function DownloadText(filename, content, bom) {
    if (bom) {
        content = decodeURI("%ef%bb%bf") + content;
    }
    let bb = new Blob([content]);
    let obj = URL.createObjectURL(bb);
    needRevokeURL = obj;
    browser.downloads.download({
        url: obj,
        filename: filename,
        saveAs: true
    }).then(function (v) {
        needRevokeID = v;
        console.log("设置了下载的缓存：", needRevokeID, needRevokeURL);
    }).catch(function (err) {
        console.error("下载失败或被取消", err);
        URL.revokeObjectURL(needRevokeURL);
    });
}
