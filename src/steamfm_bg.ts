
// 检测更新
(function () {
    let x = new XMLHttpRequest
    x.open("GET", "https://api.github.com/repos/gordonwalkedby/steam-friends-monitor/releases")
    x.onloadend = function () {
        if (this.status == 200) {
            let j = this.responseText
            let obj = JSON.parse(j)
            let str: string = obj[0].tag_name
            str = str.replace(/v/gim, "")
            let v = VerStr2Num(str)
            if (!(v > 1)) {
                console.error("不正常的版本号：", v, str)
            }
            SaveLocalValue("newversion", v)
            console.log("检测更新：", str, v)
            let now = VerStr2Num(browser.runtime.getManifest().version)
            if (v > now) {
                QuickNotice(texts.title, texts.updatefound + " v" + str)
            }
        } else {
            console.error("检测更新出错：", this.status)
        }
    }
    x.send()
})();

//　工作的基本流程
(async function () {
    browser.notifications.onClicked.addListener(function (id: string) {
        console.log("点击了弹窗", id)
        OpenOptionPage()
    })
    GetEveryID64ByURL()
    await DoOnceFriendsListCheck()
    await github.LoadTokenFromStorage()
    await AutoRemindBackupChatLog()
    await DownloadAllAndUploadAll(0)
    setInterval(async function () {
        let id = await GetCurrentIDFromCookie()
        if (id.length == id64len) {
            await DoOnceFriendsListCheck()
            await github.LoadTokenFromStorage()
            await AutoRemindBackupChatLog()
            await DownloadAllAndUploadAll(0)
        }
    }, 1000 * 60 * 60)
})();

// 打开 options.html
async function OpenOptionPage() {
    let url = browser.extension.getURL("html/options.html")
    let tabs = await browser.tabs.query({ currentWindow: true })
    tabs.forEach(function (v) {
        if (v.id != null && v.url != null) {
            if (v.url.startsWith(url)) {
                browser.tabs.remove(v.id)
            }
        }
    })
    browser.tabs.create({ url: url, active: true })
}

browser.browserAction.onClicked.addListener(OpenOptionPage)

// 更新定期提醒的时间
async function UpdateRemindBackupChatLog() {
    if (currentID.length == id64len) {
        let autoremindchatlog = await GetLocalValue("nextremind" + currentID, 0)
        if (autoremindchatlog > 0) {
            let nows = new Date
            let nowtime = nows.getTime()
            autoremindchatlog = nowtime + 24 * 60 * 60 * 1000 * 6
            await SaveLocalValue("nextremind" + currentID, autoremindchatlog)
        }
    }
}

//按时提醒该备份到本地了
async function AutoRemindBackupChatLog() {
    if (currentID.length == id64len) {
        let autoremindchatlog: number = await GetLocalValue("nextremind" + currentID, 0)
        if (autoremindchatlog > 0) {
            let nows = new Date
            let nowtime = nows.getTime()
            let lastdownload: number = await GetLocalValue("downloadtime" + currentID, 0)
            if (autoremindchatlog < 99999) {
                if (lastdownload > 9999) {
                    autoremindchatlog = lastdownload + 24 * 60 * 60 * 1000 * 6
                } else {
                    autoremindchatlog = nowtime - 100
                }
            }
            if (nowtime > autoremindchatlog) {
                let oneday = 24 * 60 * 60 * 1000
                let str = texts.nobackupbefore
                if (lastdownload > 9999) {
                    let passed = nowtime - lastdownload
                    passed /= oneday
                    str = texts.haspassed + passed.toFixed(1) + texts.days
                }
                QuickNotice(texts.youshouldexport, str)
                autoremindchatlog = nowtime + oneday
            }
            await SaveLocalValue("nextremind" + currentID, autoremindchatlog)
        }
    }
}

let currentLogDownloader = new SteamChatLogDownloader("")
// 和前台UI交互
browser.runtime.onMessage.addListener(async function (m, sender) {
    let tab = sender.tab
    if (tab == null || tab.url == null || tab.id == null) {
        return
    }
    if (tab.url == location.href) {
        return
    }
    if (showMessageLog) { console.log("接到来自其他网页的消息输入", m, sender) }
    let tabid = tab.id
    if (m == null) {
        if (showMessageLog) { console.error("这不可思议，发了个null到后台") }
        return
    }
    if (typeof (m) == "object") {
        let str = m as string[]
        if (m.length < 1) {
            if (showMessageLog) { console.error("这不可思议，发了个空数组到后台") }
            return
        }
        if (str[0] == Messages.BGLogExportStat) {
            let data: string[] = []
            data.push(str[0])   //0
            let st = currentLogDownloader.stat
            data.push(st)   //1
            if (st != SteamChatLogDownloaderStat.ready) {
                if (st == SteamChatLogDownloaderStat.failed) {
                    data.push(currentLogDownloader.errorMessage)      //2
                } else {
                    data.push(currentLogDownloader.downloadedlogs.length.toFixed()) //2
                    let dt = new Date(currentLogDownloader.oldestTime)
                    data.push(dt.toLocaleString())    //3
                    data.push(currentLogDownloader.passedPages.toFixed())   //4
                }
            }
            browser.tabs.sendMessage(tabid, data)
            return
        } else if (str[0] == Messages.startBGLogExport) {
            currentLogDownloader = new SteamChatLogDownloader(texts.manualjob)
            currentLogDownloader.oncomplete = function () {
                if (currentLogDownloader.stat == SteamChatLogDownloaderStat.finished) {
                    QuickNotice(texts.finishedexport, texts.clicktodownload)
                } else {
                    QuickNotice(texts.failonmanualexport, currentLogDownloader.errorMessage)
                }
            }
            currentLogDownloader.StartGetChatLog()
        } else if (str[0] == Messages.downloadBGLogExport) {
            if (currentLogDownloader.stat != SteamChatLogDownloaderStat.finished) {
                return
            }
            let format = str[1]
            let nows = ((new Date).getTime()).toFixed()
            let logs = currentLogDownloader.downloadedlogs
            if (format == "csvbom") {
                let csv = BuildCSV(logs, true)
                DownloadText(nows + ".csv", csv, true)
            } else if (format == "csv") {
                let csv = BuildCSV(logs, false)
                DownloadText(nows + ".csv", csv, false)
            } else if (format == "json") {
                let txt = BuildJSON(logs)
                DownloadText(nows + ".json", txt, false)
            } else {
                console.error("就nm离谱，这什么下载格式", format)
            }
            await UpdateRemindBackupChatLog()
            await SaveLocalValue("downloadtime" + currentID, (new Date).getTime())
        } else if (str[0] == Messages.gocheckfriendslist) {
            let test = str.length > 1
            DoOnceFriendsListCheck(test, true)
        }
    }
})

// 获得github的文件名，是 2020/01/15 这样的
function GetDateFileName(dt: Date): string {
    return dt.getUTCFullYear().toString() + "/" + (dt.getUTCMonth() + 1).toString().padStart(2, "0") + "/" + (dt.getUTCDate()).toString().padStart(2, "0")
}

//　跑一次后台自动运行导出日志并上传到github
async function DownloadAllAndUploadAll(retry: number, lastError: string = "") {
    if (currentID.length != id64len) { return }
    if (retry > 3) {
        QuickNotice(texts.failinbackgroundupload, lastError)
    }
    if (github.auth.length < 1) {
        return
    }
    let nextupload: number = await GetLocalValue("nextupload" + currentID, 0)
    let nows = new Date().getTime()
    console.log("下一次上传时间：", nextupload)
    if (nextupload > nows) {
        return
    }
    console.log("重试后台上传聊天日志任务：", retry)
    let wk = new SteamChatLogDownloader(texts.autojob)
    wk.StartGetChatLog()
    wk.oncomplete = async function () {
        let errors = wk.errorMessage
        if (wk.stat == SteamChatLogDownloaderStat.finished) {
            let t1 = BackgroundDownloadAndUpload(wk.downloadedlogs).catch(function (err) {
                errors = err
            })
            await t1
        }
        if (errors.length > 0) {
            DownloadAllAndUploadAll(retry + 1, errors)
        } else {
            let tomorrow = new Date
            tomorrow.setDate(tomorrow.getDate() + 1)
            await SaveLocalValue("nextupload" + currentID, tomorrow.getTime())
            console.log("后台上传任务完成")
        }
    }
}

// 信息上传到云端，这不会上传UTC日期是今天的，最起码要昨天才行
async function BackgroundDownloadAndUpload(logs: SteamChatMessage[]) {
    let today = GetDateFileName(new Date)
    let days = new Map<string, SteamChatMessage[]>()
    logs.sort(function (a, b) {
        if (a.UTCTime > b.UTCTime) {
            return 1
        } else if (a.UTCTime < b.UTCTime) {
            return -1
        }
        return 0
    })
    logs.forEach(function (v) {
        let dt = new Date(v.UTCTime)
        let str = GetDateFileName(dt)
        if (str == today) {
            return
        }
        str += ".csv"
        let array = days.get(str) || []
        array.push(v)
        days.set(str, array)
    })
    if (days.size < 1) { return }
    let uploaded: string[] = await GetLocalValue("githubuploaded" + currentID, [])
    let keys = GetMapKeys(days)
    let index = 0
    while (true) {
        let k = keys[index]
        if (uploaded.includes(k)) {
            continue
        }
        let v = days.get(k)
        if (v == null) {
            continue
        }
        let csv = BuildCSV(v, false)
        let sha = ""
        let errors = ""
        let t1 = github.GetOnlineFileSHA(k).then(function (v1) {
            sha = v1
        }).catch(function (err) {
            console.error("github 获取sha出错：", err)
            errors = err
        })
        await t1
        if (errors.length > 0) { throw errors }
        t1 = github.CreateOrUpdateTextFile(k, csv, sha).then(function () {
            uploaded.push(k)
        }).catch(function (err) {
            console.error("github 上传文件出错：", err)
            errors = err
        })
        await t1
        if (errors.length > 0) { throw errors }
        index += 1
        if (index >= keys.length) {
            break
        }
    }
    await SaveLocalValue("githubuploaded" + currentID, uploaded)
}
