"use strict";
const id64len = 17;
let currentID = "";
let showMessageLog = false;
//根据名字，获取一个存储在storage.local的值
async function GetLocalValue(name, fallback = null) {
    let vv = await browser.storage.local.get(name);
    let v1 = vv[name];
    if (v1 != null) {
        return v1;
    }
    return fallback;
}
//存储一个值到storage.local里
async function SaveLocalValue(name, v) {
    let input = { [name]: v };
    return browser.storage.local.set(input);
}
let lastnotice = "";
let clearLastNotice = 0;
setInterval(function () {
    if (clearLastNotice < 1000) {
        return;
    }
    let nows = new Date;
    if (nows.getTime() > clearLastNotice) {
        lastnotice = "";
        clearLastNotice = 0;
    }
}, 1000);
//　向用户发送简单的推送
function QuickNotice(tt, s) {
    let vv = tt + s;
    if (lastnotice == vv) {
        console.error("尝试推送被拒绝，发送过快：", tt, s);
        return;
    }
    console.log("推送：", tt, s);
    let img = browser.extension.getURL("icons/main.png");
    browser.notifications.create({ title: tt, type: "basic", message: s, iconUrl: img });
    lastnotice = vv;
    let dt = new Date;
    dt.setMinutes(dt.getMinutes() + 1);
    clearLastNotice = dt.getTime();
}
// 复制一个数组
function CloneArray(a) {
    let b = [];
    a.forEach(function (v) {
        b.push(v);
    });
    return b;
}
// html解码
function HTMLDecode(html) {
    let m = document.createElement("div");
    m.innerHTML = html;
    let s = m.innerText;
    return s;
}
// 标准化 CRLF
function ChangeCRLF(t, replaceto) {
    t = t.replace(/\r\n/gim, "\n").replace(/\r/gim, "\n").replace(/\n/gim, replaceto);
    return t;
}
// 对此函数 await 可以相当于 thread.sleep
async function Sleep(ms) {
    let p = new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve();
        }, ms);
    });
    return p;
}
// 固定的错误参数
const SteamChatLogDownloaderStat = {
    ready: "待命",
    downloading: "下载中",
    finished: "工作完成",
    failed: "失败并中止"
};
// 内部发送的消息头
const Messages = {
    BGLogExportStat: "BGLogExportStat",
    startBGLogExport: "startBGLogExport",
    downloadBGLogExport: "downloadBGLogExport",
    gocheckfriendslist: "gocheckfriendslist"
};
// 根据ID返回html元素，如果不存在就throw
function GetElementByID(id) {
    let e = document.getElementById(id);
    if (e == null) {
        throw "id " + id + " is null!";
    }
    return e;
}
// 根据 cookie 获取当前id
async function GetCurrentIDFromCookie() {
    let ck = await browser.cookies.get({ url: "https://steamcommunity.com", name: "steamRememberLogin" });
    if (ck == null) {
        return "";
    }
    let reg = new RegExp("[0-9]{17}");
    let results = reg.exec(ck.value);
    if (results == null) {
        return "";
    }
    return results[0];
}
// 把字符串引号引起来，如果字符串整个是一个数字，就在前面加一个'
function Quote(t, num2str) {
    if (t.length > 0) {
        t = t.replace(/\"/gim, "\"\"");
        if (num2str) {
            let r = new RegExp("^[0-9\.]+$", "gim");
            if (r.test(t)) {
                t = "'" + t;
            }
        }
    }
    t = "\"" + t + "\"";
    return t;
}
//获取一个map的keys
function GetMapKeys(m) {
    let keys = [];
    m.forEach(function (v, k, m) {
        keys.push(k);
    });
    return keys;
}
