
//向后台发消息，询问导出的怎么样了
setInterval(function () {
    if (!logined) { return }
    browser.runtime.sendMessage([Messages.BGLogExportStat])
}, 900)

let exportpanel = GetElementByID("exportpanel")
let oldexportStat = ""
let logined = false
let ccid64 = "";

(async function () {
    let id = await GetCurrentIDFromCookie()
    if (id.length < id64len) {
        id = "尚未登录Steam，无法工作。请先去登录Steam，再回到本页面（需要刷新）。"
    } else {
        ccid64 = id
        let nm = await GetLocalValue("nm" + id, "")
        if (nm.length > 0) {
            id = id + ": " + nm
        }
        logined = true
    }
    let currentidpanel = GetElementByID("currentidpanel")
    currentidpanel.innerText = id
    if (!logined) {
        AddButton(currentidpanel, "点我去登录", function () {
            location.href = "https://steamcommunity.com/login/home/?goto="
        })
    }
})()

function AddButton(parent: HTMLElement, text: string, onclick: (this: HTMLButtonElement) => void) {
    let button = document.createElement("button")
    parent.appendChild(button)
    button.innerText = text
    button.style.padding = "2px"
    button.style.margin = "2px"
    button.addEventListener("click", onclick)
}

browser.runtime.onMessage.addListener(async function (m, sender) {
    if (!logined) { return }
    if (sender.url == null || sender.url == location.href) {
        return
    }
    if (showMessageLog) { console.log("收到消息：", m, sender) }
    if (m == null) {
        if (showMessageLog) { console.error("这不可思议，发了个null到设置页面") }
        return
    }
    if (typeof (m) == "object") {
        let strs = m as string[]
        if (strs.length < 1) {
            if (showMessageLog) { console.error("这不可思议，发了个空数组到设置页面") }
            return
        }
        if (strs[0] == Messages.BGLogExportStat) {
            let st = strs[1]
            let asold = oldexportStat == st
            oldexportStat = st
            if (st == SteamChatLogDownloaderStat.ready) {
                if (!asold) {
                    let str = ""
                    let lastdownload = await GetLocalValue("downloadtime" + ccid64, null)
                    if (lastdownload == null) {
                        str = "您还从未通过我来导出您的steam聊天记录到本地"
                    } else {
                        let dt = lastdownload as Date
                        let passed = (new Date).getTime() - dt.getTime()
                        passed /= 24 * 60 * 60 * 100
                        if (passed < 0.2) {
                            str = "您上一次导出到本地是在不到５小时之前。"
                        } else {
                            str = "您上一次导出到本地是在 " + passed.toFixed(1) + " 天前。"
                        }
                    }
                    exportpanel.innerText = str
                    AddButton(exportpanel, "点我开始导出", function () {
                        browser.runtime.sendMessage([Messages.startBGLogExport])
                        this.remove()
                    })
                }
            } else if (st == SteamChatLogDownloaderStat.downloading) {
                exportpanel.innerText = "读取中，进度：\n已读取页数：" + strs[4] + "，共有信息条数：" + strs[2] + "，最早的消息位于：" + strs[3]
            } else if (st == SteamChatLogDownloaderStat.failed) {
                exportpanel.innerText = "导出信息出错了：" + strs[2] + "\n"
                AddButton(exportpanel, "重试", function () {
                    browser.runtime.sendMessage([Messages.startBGLogExport])
                    this.remove()
                })
            } else if (st == SteamChatLogDownloaderStat.finished) {
                if (!asold) {
                    exportpanel.innerText = "导出信息完成：\n信息数：" + strs[2] + "，最早的消息位于：" + strs[3] + "\n"
                    AddButton(exportpanel, "下载为CSV（普通人推荐，保留BOM）", function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "csvbom"])
                    })
                    AddButton(exportpanel, "下载为CSV（保留原始数字，无BOM）", function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "csv"])
                    })
                    AddButton(exportpanel, "下载为JSON", function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "json"])
                    })
                    AddButton(exportpanel, "重新导出", function () {
                        browser.runtime.sendMessage([Messages.startBGLogExport])
                        this.remove()
                    })
                }
            }
            return
        }
    }
})