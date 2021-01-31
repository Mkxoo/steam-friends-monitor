"use strict";
//向后台发消息，询问导出的怎么样了
setInterval(function () {
    if (!logined) {
        return;
    }
    browser.runtime.sendMessage([Messages.BGLogExportStat]);
}, 900);
let exportpanel = GetElementByID("exportpanel");
let oldexportStat = "";
let logined = false;
let autoremindchatlog = 0;
(async function () {
    let id = await GetCurrentIDFromCookie();
    if (id.length < id64len) {
        id = "尚未登录Steam，无法工作。请先去登录Steam，再回到本页面（需要刷新）。";
    }
    else {
        currentID = id;
        let nm = await GetLocalValue("nm" + id, "");
        if (nm.length > 0) {
            id = id + ": " + nm;
        }
        logined = true;
    }
    id += "\n";
    let currentidpanel = GetElementByID("currentidpanel");
    currentidpanel.innerText = id;
    if (!logined) {
        AddButton(currentidpanel, "点我去登录", function () {
            location.href = "https://steamcommunity.com/login/home/?goto=";
        });
    }
    else {
        autoremindchatlog = await GetLocalValue("nextremind" + currentID, 0);
        let str = "定期备份提醒";
        if (autoremindchatlog > 0) {
            str = "关闭" + str;
        }
        else {
            str = "开启" + str;
        }
        AddButton(currentidpanel, str, function () {
            if (autoremindchatlog > 0) {
                autoremindchatlog = 0;
            }
            else {
                autoremindchatlog = 100;
            }
            SaveLocalValue("nextremind" + currentID, autoremindchatlog);
            location.reload();
        });
        AddButton(currentidpanel, "设置github云端存储", async function () {
            let empty = {
                tk: "", username: "", repo: ""
            };
            let v = await GetLocalValue("gh" + currentID, empty);
            let s1 = prompt("请输入你的 github 用户名：", v.username);
            if (s1 == null) {
                return;
            }
            v.username = s1.trim();
            s1 = prompt("请输入你的 github 个人 token：", v.tk);
            if (s1 == null) {
                return;
            }
            v.tk = s1.trim();
            s1 = prompt("请输入你要使用的 github repo：", v.repo);
            if (s1 == null) {
                return;
            }
            v.repo = s1.trim();
            let str = "你填写了完整的github参数，现在我会做一次测试，如果测试成功您会看见结果。请稍等。";
            if (v.repo.length < 1 || v.tk.length < 10 || v.username.length < 1) {
                str = "你填写了不完整的github参数，视作断开与github的连接。";
                v = empty;
            }
            await SaveLocalValue("gh" + currentID, v);
            await github.LoadTokenFromStorage();
            if (github.auth.length > 3) {
                github.ListBranchs().then(function (v) {
                    QuickNotice("Github 测试成功！", "目前你的仓库里的分支有" + v.length.toString() + "条。");
                }).catch(function (err) {
                    if (err == null) {
                        err = "null";
                    }
                    QuickNotice("Github 测试失败！", "错误返回：" + err);
                });
            }
            alert(str);
        });
        let changelogpanel = GetElementByID("changelogpanel");
        let lastcheck = await GetLocalValue("lastchecklist" + currentID, 0);
        str = "";
        if (lastcheck < 1000) {
            str = "你从未检测过你的steam好友列表。";
        }
        else {
            let passed = (new Date).getTime() - lastcheck;
            passed /= 24 * 60 * 60 * 1000;
            if (passed < 0.2) {
                str = "上一次检查你steam好友列表是在不到5小时前。";
            }
            else {
                str = "上一次检查你steam好友列表是在" + passed.toFixed(1) + "天前。 ";
            }
        }
        str += "\n我会在你的浏览器开着的时候自动扫描你的steam好友列表，自动频率是浏览器开启一次，然后每个小时一次。您也可以点下面的按钮手动扫描。\n";
        changelogpanel.innerText = str;
        AddButton(changelogpanel, "立刻检测好友列表变化", function () {
            browser.runtime.sendMessage([Messages.gocheckfriendslist]);
            changelogpanel.innerText = "请在稍后刷新本页面";
        }, true);
        AddButton(changelogpanel, "假装丢失和新增了好友（测试）", function () {
            browser.runtime.sendMessage([Messages.gocheckfriendslist, "t1"]);
            changelogpanel.innerText = "请在稍后刷新本页面";
        }, true);
        let v1 = await GetLocalValue("cs" + currentID, []);
        if (v1.length < 1) {
            changelogpanel.append("\n抱歉，此处暂无信息。");
        }
        else {
            for (let i = v1.length - 1; i >= 0; i--) {
                let log = v1[i];
                let div = document.createElement("div");
                div.className = "changelogdiv";
                changelogpanel.appendChild(div);
                let span = document.createElement("span");
                span.className = "changelogtime";
                span.innerText = log.Time.toLocaleString();
                div.appendChild(span);
                if (log.gets.length > 0) {
                    log.gets.forEach(function (id) {
                        let a1 = document.createElement("a");
                        a1.className = "changeloggetid";
                        a1.href = "https://steamcommunity.com/profiles/" + id;
                        a1.innerText = id;
                        a1.target = "_blank";
                        div.appendChild(a1);
                    });
                }
                if (log.losts.length > 0) {
                    log.losts.forEach(function (id) {
                        let a1 = document.createElement("a");
                        a1.className = "changeloglostid";
                        a1.href = "https://steamcommunity.com/profiles/" + id;
                        a1.innerText = id;
                        a1.target = "_blank";
                        div.appendChild(a1);
                    });
                }
            }
        }
    }
})();
function AddButton(parent, text, onclick, addline = false) {
    let button = document.createElement("button");
    parent.appendChild(button);
    button.innerText = text;
    button.style.padding = "2px";
    button.style.margin = "2px";
    button.addEventListener("click", onclick);
    if (addline) {
        let br = document.createElement("br");
        parent.appendChild(br);
    }
}
browser.runtime.onMessage.addListener(async function (m, sender) {
    if (!logined) {
        return;
    }
    if (sender.url == null || sender.url == location.href) {
        return;
    }
    if (showMessageLog) {
        console.log("收到消息：", m, sender);
    }
    if (m == null) {
        if (showMessageLog) {
            console.error("这不可思议，发了个null到设置页面");
        }
        return;
    }
    if (typeof (m) == "object") {
        let strs = m;
        if (strs.length < 1) {
            if (showMessageLog) {
                console.error("这不可思议，发了个空数组到设置页面");
            }
            return;
        }
        if (strs[0] == Messages.BGLogExportStat) {
            let st = strs[1];
            let asold = oldexportStat == st;
            oldexportStat = st;
            if (st == SteamChatLogDownloaderStat.ready) {
                if (!asold) {
                    let str = "";
                    let lastdownload = await GetLocalValue("downloadtime" + currentID, null);
                    if (lastdownload == null) {
                        str = "您还从未通过我来导出您的steam聊天记录到本地";
                    }
                    else {
                        let dt = lastdownload;
                        let passed = (new Date).getTime() - dt;
                        passed /= 24 * 60 * 60 * 1000;
                        if (passed < 0.2) {
                            str = "您上一次导出到本地是在不到5小时之前。";
                        }
                        else {
                            str = "您上一次导出到本地是在 " + passed.toFixed(1) + " 天前。";
                        }
                    }
                    if (autoremindchatlog > 0) {
                        str += "\n您已开启自动提醒，如果你6天以上没有备份聊天记录到本地，我就会发一条推送提醒你。";
                    }
                    exportpanel.innerText = str + "\n";
                    AddButton(exportpanel, "点我开始导出", function () {
                        browser.runtime.sendMessage([Messages.startBGLogExport]);
                        this.remove();
                    });
                }
            }
            else if (st == SteamChatLogDownloaderStat.downloading) {
                exportpanel.innerText = "读取中，进度：\n已读取页数：" + strs[4] + "，共有信息条数：" + strs[2] + "，最早的消息位于：" + strs[3];
            }
            else if (st == SteamChatLogDownloaderStat.failed) {
                exportpanel.innerText = "导出信息出错了：" + strs[2] + "\n";
                AddButton(exportpanel, "重试", function () {
                    browser.runtime.sendMessage([Messages.startBGLogExport]);
                    this.remove();
                });
            }
            else if (st == SteamChatLogDownloaderStat.finished) {
                if (!asold) {
                    exportpanel.innerText = "导出信息完成：\n信息数：" + strs[2] + "，最早的消息位于：" + strs[3] + "\n";
                    AddButton(exportpanel, "下载为CSV（普通人推荐，保留BOM）", function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "csvbom"]);
                    });
                    AddButton(exportpanel, "下载为CSV（保留原始数字，无BOM）", function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "csv"]);
                    });
                    AddButton(exportpanel, "下载为JSON", function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "json"]);
                    });
                    AddButton(exportpanel, "重新导出", function () {
                        browser.runtime.sendMessage([Messages.startBGLogExport]);
                        this.remove();
                    });
                }
            }
            return;
        }
    }
});
