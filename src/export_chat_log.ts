
// 把steamchatmessage转换为map
function ConvertSteamChatMessageToMap(v: SteamChatMessage): Map<string, string | number> {
    let mm = new Map<string, string | number>()
    mm.set("SenderID", v.SenderID)
    mm.set("Sender", v.Sender)
    mm.set("RecipientID", v.RecipientID)
    mm.set("Recipient", v.Recipient)
    mm.set("Time", v.Time)
    mm.set("UTCTime", v.UTCTime)
    mm.set("Message", v.Message)
    return mm
}

// 构造steam聊天记录的CSV文件
function BuildCSV(msg: SteamChatMessage[], num2str: boolean): string {
    if (msg.length < 1) {
        return ""
    }
    let o = ""
    let first = msg[0]
    let map1 = ConvertSteamChatMessageToMap(first)
    let keys = GetMapKeys(map1)
    keys.forEach(function (kk) {
        if (o.length > 1) {
            o += ","
        }
        o += kk
    })
    msg.forEach(function (v) {
        o += "\n"
        let map2 = ConvertSteamChatMessageToMap(v)
        let str = ""
        let dt = new Date
        let z = "0"
        dt.setTime(map2.get("UTCTime") as number)
        str = dt.getFullYear().toString().padStart(4, z) + "/" + (dt.getMonth() + 1).toString().padStart(2, z) + "/"
        str += dt.getDate().toString().padStart(2, z) + " " + (dt.getHours()).toString().padStart(2, z) + ":"
        str += (dt.getMinutes()).toString().padStart(2, z) + ":" + (dt.getSeconds)().toString().padStart(2, z)
        map2.set("Time", str)
        let line = ""
        keys.forEach(function (kk) {
            if (line.length > 2) {
                line += ","
            }
            let v2 = map2.get(kk)
            if (v2 == null) {
                v2 = "null"
            }
            str = v2.toString()
            line += Quote(str, num2str)
        })
        o += line
    })
    return o
}

//构造steam聊天记录的JSON文件
function BuildJSON(msg: SteamChatMessage[]): string {
    let j = JSON.stringify(msg)
    return j
}

let needRevokeID: number = 0
let needRevokeURL: string = ""

browser.downloads.onChanged.addListener(function (cd) {
    let st = cd.state
    if (st == null || st.current == null) { return }
    if (st.current != "in_progress") {
        if (cd.id == needRevokeID) {
            URL.revokeObjectURL(needRevokeURL)
            console.log("释放了下载的缓存：", needRevokeID, needRevokeURL)
        }
    }
})

// 下载一个文本文件
function DownloadText(filename: string, content: string, bom: boolean) {
    if (bom) {
        content = decodeURI("%ef%bb%bf") + content
    }
    let bb = new Blob([content])
    let obj = URL.createObjectURL(bb)
    needRevokeURL = obj
    browser.downloads.download({
        url: obj,
        filename: filename,
        saveAs: true
    }).then(function (v) {
        needRevokeID = v
        console.log("设置了下载的缓存：", needRevokeID, needRevokeURL)
    }).catch(function (err) {
        console.error("下载失败或被取消", err)
        URL.revokeObjectURL(needRevokeURL)
    })
}

let SteamIDCache = new Map<string, string>();

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
    //title 是工作标题，stops是停止时间，表示如果翻到那一页已经到了这个时间，就可以停止了
    constructor(title: string, stops: number = 0) {
        this.stops = stops
        this.title = title
        console.log("新实例 SteamChatLogDownloader ，标题是：", title, stops)
        if (stops > 9999) {
            let dt = new Date(stops)
            console.log("采集时间截至是：", dt.toLocaleString())
        }
    }
    title: string = ""
    stops: number = 0
    passedPages: number = 0
    oldestTime: number = (new Date).getTime()
    downloadedlogs: SteamChatMessage[] = []
    waitURLs: string[] = []
    stat: string = SteamChatLogDownloaderStat.ready
    oncomplete: () => void = function () { }
    onloadendpage: () => void = function () { }
    errorMessage: string = ""

    PushToDownloaded(array: SteamChatMessage[]) {
        let me = this
        let timeup = false
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
                me.onloadendpage()
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
                } else if (me.stops > 9999 && me.oldestTime < me.stops) {
                    console.log("时间已经达到设置的坐标尽头，就地停止", me)
                    me.ReplaceAllURLtoID64()
                }
                else {
                    ct = data.continue
                    me.onloadendpage()
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
