
let SteamIDCache = new Map<string, string>()

// 从 HTML 中获取 STEAMID64，返回是否成功，不适用于 help.steampowered
function SetSteamIDFromHTML(html: string): boolean {
    let reg = new RegExp("g_steamID = \"(7[0-9]{16})\";", "gim")
    let results = reg.exec(html)
    if (results == null) {
        currentID = ""
        return false
    }
    currentID = results[1]
    return true
}

//从本地获取当前登录ID的存储的好友列表
async function GetFriendsListFromLocal(): Promise<string[]> {
    if (currentID.length == id64len) {
        let nm = "fl" + currentID
        let vv: string[] = await GetLocalValue(nm, [])
        return vv
    }
    return []
}

//从本地获取当前登录ID的存储的好友列表
async function SaveFriendsListToLocal(list: string[]): Promise<void> {
    if (currentID.length == id64len) {
        let nm = "fl" + currentID
        return SaveLocalValue(nm, list)
    }
}

//从STEAM在线读取好友列表，并设置当前ID为登录的ID
async function GetFriendsListFromOnline(): Promise<string[]> {
    let x = new XMLHttpRequest()
    x.open("GET", "https://steamcommunity.com/my/friends/")
    x.timeout = 8000
    let p = new Promise<string[]>(function (resolve, reject) {
        x.onloadend = function () {
            if (x.responseURL.includes("/login/")) {
                console.error(texts.loginfail, x.responseURL)
                reject(texts.loginfail)
                return
            }
            let html = x.responseText
            if (SetSteamIDFromHTML(html)) {
                console.log("用户steam id:", currentID)
                let reg1 = new RegExp("<title>(.+?)</title>", "gim")
                let results = reg1.exec(html)
                if (results == null) {
                    console.error("没有<title>", reg1)
                } else {
                    let name = results[1]
                    SaveLocalValue("nm" + currentID, name)
                }
                html = ChangeCRLF(html, " ")
                let matches = html.match(new RegExp("data-steamid=\"(7[0-9]{16})\".+?href=\"https://steamcommunity.com/.+?\"", "gim"))
                if (matches == null) {
                    console.error(texts.goodbutnofriends, x.responseURL)
                    reject(texts.goodbutnofriends)
                    return
                }
                let out: string[] = []
                let reg2 = new RegExp("[0-9]{17}")
                let reg3 = new RegExp("(https://steamcommunity.com/.+?)\"")
                matches.forEach(function (v) {
                    results = reg2.exec(v)
                    if (results == null) {
                        console.error("出现了无法解析的字符串：", v, reg2)
                        reject(texts.impossiblestr)
                        return
                    }
                    let id = results[0]
                    if (!out.includes(id)) {
                        out.push(id)
                    }
                    results = reg3.exec(v)
                    if (results == null) {
                        console.error("出现了无法解析的字符串：", v, reg3)
                        reject(texts.impossiblestr)
                        return
                    }
                    let url = results[1]
                    if (url.endsWith("/") == false) {
                        url += "/"
                    }
                    SteamIDCache.set(url, id)
                })
                resolve(out)
            } else {
                console.error(texts.cantlogin)
                reject(texts.cantlogin)
            }
        }
        x.send()
    })
    return p
}

// 更新一个日志到存储里
async function UpdateFriendsChangeLog(log: FriendsChangeLog) {
    if (currentID.length == id64len) {
        let nm = "cs" + currentID
        let olds: FriendsChangeLog[] = await GetLocalValue(nm, [])
        olds.push(log)
        return SaveLocalValue(nm, olds)
    }
}

//一次完整的steam好友检查
async function DoOnceFriendsListCheck(test: boolean = false, manual: boolean = false) {
    console.log("开启一次steam检查")
    return GetFriendsListFromOnline().then(async function (v1) {
        if (v1.length < 1) {
            console.log("从网络读取的好友数量为0个，不做处理", currentID)
            return
        }
        let ov1 = CloneArray<string>(v1)
        if (test) {
            v1.push("23331198099466387")
            v1.push("23341198099466387")
        }
        let olds = await GetFriendsListFromLocal()
        if (test) {
            olds.push("23351198099466387")
            olds.push("23361198099466387")
        }
        if (olds.length > 0) {
            let log: FriendsChangeLog = {
                Time: new Date,
                losts: [],
                gets: []
            }
            let changed = false
            while (v1.length > 0) {
                let id = v1.pop()
                if (id == null) { break }
                let oldindex = olds.indexOf(id)
                if (oldindex >= 0) {
                    olds.splice(oldindex, 1)
                } else {
                    log.gets.push(id)
                    changed = true
                }
            }
            if (olds.length > 0) {
                changed = true
                olds.forEach(function (v2) {
                    log.losts.push(v2)
                })
            }
            if (changed) {
                let str = ""
                let v3 = log.losts.length
                if (v3 > 0) {
                    str += texts.losts + v3.toFixed() + texts.ge
                }
                v3 = log.gets.length
                if (v3 > 0) {
                    if (str.length > 0) {
                        str += "，"
                    }
                    str += texts.gets + v3.toFixed() + texts.ge
                }
                QuickNotice(texts.yourflisthaschanged, str)
                await UpdateFriendsChangeLog(log)
            } else {
                console.log(texts.yourflistnochange)
                if (manual) {
                    QuickNotice(texts.yourflistnochange, texts.youallhave + ov1.length.toString())
                }
            }
        } else {
            console.log("从本地读取的好友数量为0个，不做处理", currentID)
        }
        await SaveLocalValue("lastchecklist" + currentID, (new Date).getTime())
        await SaveFriendsListToLocal(ov1)
        console.log("处理完成，好友数量：", ov1.length)
    }).catch(function (err) {
        QuickNotice(texts.errorwhencheckflist, err)
    })
}

//　steam id64 获取队列和缓存
let ID64QueryList: string[] = []
let impossibleURLs: string[] = []
//　尝试直接获取一个url的steamid64，先检查cache，再检查url是不是本身自带，最后加入队列，从steam官网获取
function TryGetSteamID64ByURL(u: string): string {
    let r = SteamIDCache.get(u)
    if (r == null) {
        let reg = new RegExp("/profiles/([0-9]{17})", "gim")
        let results = reg.exec(u)
        if (results != null) {
            let id64 = results[1]
            SteamIDCache.set(u, id64)
            return id64
        }
        if (impossibleURLs.includes(u)) {
            console.log("这是一个不可能存在的链接或者无法获取的链接", u)
            return u
        }
        if (!ID64QueryList.includes(u)) {
            console.log("新增进id64获取队列：", u)
            ID64QueryList.push(u)
        }
        return u
    }
    return r
}
async function GetEveryID64ByURL() {
    let idretry = new Map<string, number>()
    while (true) {
        if (ID64QueryList.length > 0) {
            console.log("ID64QueryList length:", ID64QueryList.length)
            let url = ID64QueryList[0]
            let retry = (idretry.get(url) || -1) + 1
            if (retry > 3) {
                ID64QueryList.splice(0, 1)
                console.error("获取steamid64出错次数过多，添加到不可能链接：", retry, url)
                if (!impossibleURLs.includes(url)) {
                    impossibleURLs.push(url)
                }
                continue
            }
            idretry.set(url, retry)
            let x = new XMLHttpRequest()
            x.open("GET", url)
            x.timeout = 5000
            let id64 = ""
            await new Promise<string>(function (resolve, reject) {
                console.log("获取steamid64", retry, url)
                x.onloadend = function () {
                    if (this.status == 200) {
                        let reg = new RegExp("g_rgProfileData.+?\"([0-9]{17})", "gi")
                        let results = reg.exec(this.responseText)
                        if (results != null) {
                            id64 = results[1]
                            SteamIDCache.set(url, id64)
                            console.log("成功联网获取：", url, id64)
                        } else {
                            console.error("不可思议，这个主页没有steamid64", url, reg)
                        }
                    } else {
                        console.error("请求好友主页，返回不是200或超时", url, this.status)
                    }
                    resolve(id64)
                }
                x.send()
            })
            if (id64.length == id64len) {
                SteamIDCache.set(url, id64)
                ID64QueryList.splice(0, 1)
                idretry.delete(url)
            }
        }
        await Sleep(400)
    }
}

// Steam聊天记录下载器，使用之前务必登录先
class SteamChatLogDownloader {
    //新建实例的时候要设置结束日期，不设置就是获取20天（官方实际为最多14天）
    constructor(title: string, stops: number = 0) {
        this.stops = stops
        this.title = title
    }
    title: string = ""
    stops: number = 0
    passedPages: number = 0
    oldestTime: number = (new Date).getTime()
    downloadedlogs: SteamChatMessage[] = []
    waitURLs: string[] = []
    stat: string = SteamChatLogDownloaderStat.ready
    oncomplete: () => void = function () { }
    errorMessage: string = ""

    PushToDownloaded(array: SteamChatMessage[]) {
        let me = this
        array.forEach(function (v) {
            me.downloadedlogs.push(v)
            me.oldestTime = v.UTCTime
            if (v.SenderID.length != id64len) {
                if (!me.waitURLs.includes(v.SenderID)) {
                    me.waitURLs.push(v.SenderID)
                }
            }
            if (v.RecipientID.length != id64len) {
                if (!me.waitURLs.includes(v.RecipientID)) {
                    me.waitURLs.push(v.RecipientID)
                }
            }
        })
    }

    SetError(s: string) {
        let me = this
        me.errorMessage = s
        console.error("出错：", me.title, s)
        me.stat = SteamChatLogDownloaderStat.failed
        me.oncomplete()
    }

    //从获取聊天记录第一页开始做起
    StartGetChatLog() {
        let me = this
        if (me.stat != SteamChatLogDownloaderStat.ready) {
            console.error("已经开始过了，不能再开始了！需要再新建一个实例！")
            return
        }
        console.log("获取第一页聊天记录", me.title)
        me.stat = SteamChatLogDownloaderStat.downloading
        let x = new XMLHttpRequest()
        x.open("GET", "https://help.steampowered.com/zh-cn/accountdata/GetFriendMessagesLog")
        x.timeout = 8000
        x.onloadend = function () {
            if (x.responseURL.includes("/login/")) {
                me.SetError(texts.loginfail)
                return
            }
            if (x.status == 200) {
                let html = x.responseText
                let logs = me.ParseHTMLTable(html)
                me.passedPages += 1
                if (logs.length > 0) {
                    me.PushToDownloaded(logs)
                    console.log("新增聊天记录：", logs.length)
                } else {
                    me.SetError(texts.nochatlog)
                    return
                }
                let r = new RegExp("data-continuevalue=\"([0-9_]+)\"", "gim")
                let results = r.exec(html)
                if (results != null) {
                    let ct = results[1]
                    me.LoadNextPage(ct, 0)
                } else {
                    console.error("这家伙只有一页聊天记录")
                    me.ReplaceAllURLtoID64()
                    return
                }
            } else {
                me.SetError(texts.checkingindexpagefail)
                return
            }
        }
        x.send()
    }
    LoadNextPage(ct: string, retry: number) {
        let me = this
        if (retry > 3) {
            me.SetError(texts.checkinglogfail)
            return
        }
        console.log("获取聊天记录，重试：", ct, retry, me.title)
        let x = new XMLHttpRequest
        x.open("GET", "https://help.steampowered.com/zh-cn/accountdata/AjaxLoadMoreData/?url=GetFriendMessagesLog&continue=" + ct)
        x.timeout = 5000
        x.onloadend = function () {
            if (this.status == 200) {
                let jj = this.responseText
                let data: SteamChatLogDataJSON = JSON.parse(jj)
                let logs = me.ParseHTMLTable(data.html)
                me.PushToDownloaded(logs)
                me.passedPages += 1
                if (data.continue == null) {
                    console.log("没有continue了，应该是到头了", me)
                    me.ReplaceAllURLtoID64()
                } else {
                    ct = data.continue
                    setTimeout(function () {
                        me.LoadNextPage(ct, 0)
                    }, 500)
                }
            } else {
                console.error("请求下一页聊天记录，返回非200或超时", ct)
                me.LoadNextPage(ct, retry + 1)
            }
        }
        x.send()
    }
    //等待一定时间，然后把全部的链接替换成id64
    async ReplaceAllURLtoID64() {
        let me = this
        let urls: string[] = CloneArray(me.waitURLs)
        let goodids = new Map<string, string>()
        while (urls.length > 0) {
            let lefts: string[] = []
            urls.forEach(function (v) {
                if (impossibleURLs.includes(v)) {
                    return
                }
                let id = TryGetSteamID64ByURL(v)
                if (id.length != id64len) {
                    lefts.push(v)
                } else {
                    goodids.set(v, id)
                }
            })
            urls = lefts
            if (lefts.length < 1) {
                break
            }
            await Sleep(100)
        }
        this.waitURLs = []
        me.downloadedlogs.forEach(function (log) {
            if (log.SenderID.length != id64len) {
                let id = goodids.get(log.SenderID)
                if (id != null) {
                    log.SenderID = id
                }
            }
            if (log.RecipientID.length != id64len) {
                let id = goodids.get(log.RecipientID)
                if (id != null) {
                    log.RecipientID = id
                }
            }
        })
        me.stat = SteamChatLogDownloaderStat.finished
        console.log("聊天记录获取完成！", this)
        this.oncomplete()
    }

    usedSeconds = new Map<string, number>()
    usedMS = new Map<string, number>()

    // 解析Chinese 字符串 2021年1月28日下午1:13 CST
    ParseChineseDateFormat(s: string): Date {
        let me = this
        let dt = new Date(1999, 0, 1)
        if (s.length < 10) {
            return dt
        }
        let r = new RegExp("([0-9]+)年([0-9]+)月([0-9]+)日([上下])午([0-9]+):([0-9]+)", "gim")
        let results = r.exec(s)
        if (results == null) {
            return dt
        }
        let yyyy = parseInt(results[1])
        let mm = parseInt(results[2]) - 1
        let dd = parseInt(results[3])
        let morning = results[4] == "上"
        let hour = parseInt(results[5])
        let min = parseInt(results[6])
        if (morning && hour == 12) {    //12:01AM就是 00:01
            hour = 0
        } else if (!morning && hour < 12) { //12:01 PM 就是 12:01 ，1:01 PM 就是 13:01
            hour += 12
        }
        dt = new Date(yyyy, mm, dd, hour, min, 0)
        let kk = dt.getTime().toFixed()
        // 由于steam返回的文本里面不包含秒数，为了让数据在排序的时候更加可靠，采用了秒数逐渐-1的策略，第一条数据会是这一分钟的59秒，然后是58，直到0秒
        let v: number = 59
        let ms = 999
        if (me.usedSeconds.has(kk)) {
            v = me.usedSeconds.get(kk) || v
            if (v > 0) {
                v -= 1
            } else {
                if (me.usedMS.has(kk)) {
                    ms = me.usedMS.get(kk) || ms
                    if (ms > 0) {
                        ms -= 1
                    }
                }
                me.usedMS.set(kk, ms)
            }
        }
        me.usedSeconds.set(kk, v)
        dt.setSeconds(v, ms)
        return dt
    }

    //处理html数据
    ParseHTMLTable(html: string): SteamChatMessage[] {
        let me = this
        html = html.replace(/"/gim, "'")
        let reg = new RegExp("<tr><td><a target='_blank'.+?</td></tr>", "gim")
        let array = html.match(reg)
        let outs: Array<SteamChatMessage> = []
        if (array != null) {
            array.forEach(function (v, i, aa) {
                reg = new RegExp("<td><a target='_blank' href='(.+?)'>(.+?)</a></td><td><a target='_blank' href='(.+?)'>(.+?)</a></td><td>(.+?)</td><td>(.+?)</td>", "gim")
                let results = reg.exec(v)
                if (results != null) {
                    let ss = HTMLDecode(results[5])
                    let dt = me.ParseChineseDateFormat(ss)
                    if (dt.getFullYear() < 2000) {
                        console.error("这个日期无法转换： ", ss)
                        return
                    }
                    let m: SteamChatMessage = {
                        SenderID: TryGetSteamID64ByURL(results[1]),
                        Sender: HTMLDecode(results[2]),
                        RecipientID: TryGetSteamID64ByURL(results[3]),
                        Recipient: HTMLDecode(results[4]),
                        Time: dt.toLocaleString(),
                        UTCTime: dt.getTime(),
                        Message: ChangeCRLF(HTMLDecode(results[6]), " ")
                    }
                    outs.push(m)
                } else {
                    console.error("html 无法寻找对应值 " + v)
                }
            })
        } else {
            console.error("html无法符合记录！")
        }
        return outs
    }
}

(async function () {
    browser.notifications.onClicked.addListener(function () {
        browser.runtime.openOptionsPage()
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
})()

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

browser.browserAction.onClicked.addListener(async function () {
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
})

function GetDateFileName(dt: Date): string {
    return dt.getUTCFullYear().toString() + "/" + (dt.getUTCMonth() + 1).toString().padStart(2, "0") + "/" + (dt.getUTCDate()).toString().padStart(2, "0")
}

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
