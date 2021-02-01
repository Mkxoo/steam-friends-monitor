const id64len = 17
let currentID = ""
let showMessageLog = false

function VerStr2Num(v: string): number {
    let reg = new RegExp("([0-9]+)\.([0-9]+)")
    let results = reg.exec(v)
    if (results == null) { return 0 }
    let v1 = parseInt(results[1])
    let v2 = parseInt(results[2])
    let out = v1 * 100000 + v2
    return out
}

//根据名字，获取一个存储在storage.local的值
async function GetLocalValue(name: string, fallback: any = null): Promise<any> {
    let vv = await browser.storage.local.get(name)
    let v1 = vv[name]
    if (v1 != null) {
        return v1
    }
    return fallback
}

//存储一个值到storage.local里
async function SaveLocalValue(name: string, v: any) {
    let input = { [name]: v }
    return browser.storage.local.set(input)
}

//　向用户发送简单的推送
function QuickNotice(tt: string, s: string) {
    console.log("推送：", tt, s)
    let img = browser.extension.getURL("icons/main.png")
    browser.notifications.create({ title: tt, type: "basic", message: s, iconUrl: img })
}

// 复制一个数组
function CloneArray<T>(a: Array<T>): Array<T> {
    let b: Array<T> = []
    a.forEach(function (v) {
        b.push(v)
    })
    return b
}

// html解码
function HTMLDecode(html: string): string {
    let m = new Map<string, string>()
    m.set("&gt;", ">")
    m.set("&lt;", "<")
    m.set("&amp;", "&")
    m.set("&quot;", "\"")
    m.set("&nbsp;", " ")
    m.set("<br.*?>", "\n")
    m.forEach(function (v, k) {
        let reg = new RegExp(k, "gim")
        html = html.replace(reg, v)
    })
    return html
}

// 标准化 CRLF
function ChangeCRLF(t: string, replaceto: string): string {
    t = t.replace(/\r\n/gim, "\n").replace(/\r/gim, "\n").replace(/\n/gim, replaceto)
    return t
}

// 对此函数 await 可以相当于 thread.sleep
async function Sleep(ms: number) {
    let p = new Promise<void>(function (resolve, reject) {
        setTimeout(function () {
            resolve()
        }, ms)
    })
    return p
}

// 固定的错误参数
const SteamChatLogDownloaderStat = {
    ready: "待命",
    downloading: "下载中",
    finished: "工作完成",
    failed: "失败并中止"
}

// 内部发送的消息头
const Messages = {
    setTabid: "settabid",
    githubStatus: "githubStatus",
    BGLogExportStat: "BGLogExportStat",
    startBGLogExport: "startBGLogExport",
    downloadBGLogExport: "downloadBGLogExport",
    gocheckfriendslist: "gocheckfriendslist",
    startGithubUpload: "startGithubUpload"
}

// 根据ID返回html元素，如果不存在就throw
function GetElementByID(id: string): HTMLElement {
    let e = document.getElementById(id)
    if (e == null) { throw "id " + id + " is null!" }
    return e as HTMLElement
}

// 根据 cookie 获取当前id
async function GetCurrentIDFromCookie(): Promise<string> {
    let ck = await browser.cookies.get({ url: "https://steamcommunity.com", name: "steamRememberLogin" })
    if (ck == null) {
        return ""
    }
    let reg = new RegExp("[0-9]{17}")
    let results = reg.exec(ck.value)
    if (results == null) {
        return ""
    }
    return results[0]
}

// 把字符串引号引起来，如果字符串整个是一个数字，就在前面加一个'
function Quote(t: string, num2str: boolean): string {
    if (t.length > 0) {
        t = t.replace(/\"/gim, "\"\"")
        if (num2str) {
            let r = new RegExp("^[0-9\.]+$", "gim")
            if (r.test(t)) {
                t = "'" + t
            }
        }
    }
    t = "\"" + t + "\""
    return t
}

//获取一个map的keys
function GetMapKeys(m: Map<string, any>): string[] {
    let keys: string[] = []
    m.forEach(function (v, k, m) {
        keys.push(k)
    })
    return keys
}
