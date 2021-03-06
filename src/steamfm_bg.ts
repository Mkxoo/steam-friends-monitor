
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
    await RunGithubAutoJob(0)
    setInterval(async function () {
        let id = await GetCurrentIDFromCookie()
        if (id.length == id64len) {
            await DoOnceFriendsListCheck()
            await github.LoadTokenFromStorage()
            await AutoRemindBackupChatLog()
            await RunGithubAutoJob(0)
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

let OptionTabid = -1
let currentLogDownloader = new SteamChatLogDownloader("")
// 和前台UI交互
browser.runtime.onMessage.addListener(async function (m, sender) {
    if (currentID.length != id64len) { return }
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
        if (str[0] == Messages.setTabid) {
            OptionTabid = tabid
        }
        else if (str[0] == Messages.startBGLogExport) {
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
        } else if (str[0] == Messages.startGithubUpload) {
            await SaveLocalValue("nextupload" + currentID, 0)
            await github.LoadTokenFromStorage()
            RunGithubAutoJob(0)
        }
    }
})

// 定时向工作页面发送状态信息
setInterval(function () {
    if (OptionTabid < 0) { return }
    browser.tabs.get(OptionTabid).then(function (tab) {
        let data: string[] = []
        data.push(Messages.BGLogExportStat)   //0
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
        browser.tabs.sendMessage(OptionTabid, data)
        data = [Messages.githubStatus]  //0
        data.push(githubStatus) //1
        let s = ""
        if (IsGithubReady) {
            s = "33"
        }
        data.push(s) //2
        browser.tabs.sendMessage(OptionTabid, data)
    }).catch(function () {
        OptionTabid = -1
    })
}, 1000)

// 获得github的文件名，是 2020/01/15 这样的
function GetDateFileName(dt: Date): string {
    return dt.getUTCFullYear().toString() + "/" + (dt.getUTCMonth() + 1).toString().padStart(2, "0") + "/" + (dt.getUTCDate()).toString().padStart(2, "0")
}

let IsGithubReady = false
let githubStatus = ""

//　跑一次后台自动运行导出日志并上传到github
async function RunGithubAutoJob(retry: number, lastError: string = "") {
    console.log("尝试运行github上传", retry, lastError)
    if (currentID.length != id64len) {
        githubStatus = texts.needlogin
        return
    }
    if (retry > 3) {
        QuickNotice(texts.failinbackgroundupload, lastError)
        githubStatus = texts.failinbackgroundupload + " " + lastError
        return
    }
    if (github.auth.length < 1) {
        githubStatus = texts.githubmiss
        return
    }
    let nextupload: number = await GetLocalValue("nextupload" + currentID, 0)
    let nows = new Date().getTime()
    console.log("下一次上传时间：", nextupload)
    if (nextupload > nows) {
        let dt = new Date(nextupload)
        IsGithubReady = true
        githubStatus = texts.nextgithubupload + dt.toLocaleString()
        return
    }
    console.log("重试后台上传聊天日志任务：", retry)
    let syncstart: number = await GetLocalValue("syncstart" + currentID, 0)
    let wk = new SteamChatLogDownloader(texts.autojob, syncstart)
    IsGithubReady = false
    wk.onloadendpage = function () {
        githubStatus = texts.reading + "\n" + texts.passedpages + wk.passedPages.toFixed()
        if (retry > 0) {
            githubStatus += "（" + texts.retry + "：" + retry.toFixed() + "）"
        }
    }
    wk.StartGetChatLog()
    wk.oncomplete = async function () {
        let errors = wk.errorMessage
        if (wk.stat == SteamChatLogDownloaderStat.finished) {
            await BackgroundUpload(wk.downloadedlogs)
            errors = lastGithubUploadError
        }
        if (errors.length > 0) {
            RunGithubAutoJob(retry + 1, errors)
        } else {
            let tomorrow = new Date
            tomorrow.setDate(tomorrow.getDate() + 1)
            let yesterday = new Date
            yesterday.setHours(yesterday.getHours() - 30)
            await SaveLocalValue("syncstart" + currentID, yesterday.getTime())
            await SaveLocalValue("nextupload" + currentID, tomorrow.getTime())
            let now = new Date
            githubStatus = texts.uploadover + now.toLocaleString()
            IsGithubReady = true
            console.log("后台上传任务完成")
        }
    }
}

let lastGithubUploadError = ""

// 信息上传到云端，这不会上传UTC日期是今天的，最起码要昨天才行
async function BackgroundUpload(logs: SteamChatMessage[]) {
    if (logs.length < 1) { return }
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
    for (let index = 0; index < keys.length; index++) {
        lastGithubUploadError = ""
        githubStatus = texts.uploading + index.toFixed() + " / " + keys.length.toFixed()
        let k = keys[index]
        if (uploaded.includes(k)) {
            continue
        }
        let v = days.get(k)
        if (v == null) {
            continue
        }
        let csv = BuildCSV(v, false)
        let ok = await UpdateCSVtoGithub(k, csv, 0)
        if (ok) {
            uploaded.push(k)
        } else {
            githubStatus = texts.failinbackgroundupload + " " + lastGithubUploadError
            return
        }
        if (index >= keys.length) {
            break
        }
    }
    await SaveLocalValue("githubuploaded" + currentID, uploaded)
}

// 上传到CSV，会内部自动反复重试，最多试3次，返回是否成功
async function UpdateCSVtoGithub(filename: string, csv: string, retry: number): Promise<boolean> {
    if (retry > 3) {
        console.error("重试次数过多，放弃了：", filename)
        return false
    }
    let sha = ""
    let errors = ""
    let t1 = github.GetOnlineFileSHA(filename).then(function (v1) {
        sha = v1
    }).catch(function (err) {
        lastGithubUploadError = err
        console.error("github 获取sha出错：", err)
        errors = err
    })
    await t1
    if (errors.length > 0) {
        return await UpdateCSVtoGithub(filename, csv, retry + 1)
    }
    t1 = github.CreateOrUpdateTextFile(filename, csv, sha).then(function () {
    }).catch(function (err) {
        lastGithubUploadError = err
        console.error("github 上传文件出错：", err)
        errors = err
    })
    await t1
    if (errors.length > 0) {
        return await UpdateCSVtoGithub(filename, csv, retry + 1)
    }
    return true
}
