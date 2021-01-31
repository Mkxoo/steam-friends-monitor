const id64len = 17
let showMessageLog = false

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
    let m = document.createElement("div")
    m.innerHTML = html
    let s = m.innerText
    return s
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
let MyErrors = {
    logout: "你的登录掉了",
    findnoid: "找不到网页里面你自己的steamid64",
    findnofriends: "你一个朋友都没有",
    timeout: "请求超时",
    regError: "regex出错"
}

// 固定的错误参数
let SteamChatLogDownloaderStat = {
    ready: "待命",
    downloading: "下载中",
    finished: "工作完成",
    failed: "失败并中止"
}

// 内部发送的消息头
let Messages = {
    BGLogExportStat: "BGLogExportStat",
    startBGLogExport: "startBGLogExport",
    downloadBGLogExport: "downloadBGLogExport"
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
        t = t.replace(/\"/gim, "\\\"")
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
