
//向后台发消息，询问导出的怎么样了
setInterval(function () {
    if (!logined) { return }
    browser.runtime.sendMessage([Messages.BGLogExportStat])
}, 900)

let exportpanel = GetElementByID("exportpanel")
let oldexportStat = ""
let logined = false
let autoremindchatlog = 0;

(async function () {
    let id = await GetCurrentIDFromCookie()
    if (id.length < id64len) {
        id = texts.needlogin
    } else {
        currentID = id
        let nm = await GetLocalValue("nm" + id, "")
        if (nm.length > 0) {
            id = id + ": " + nm
        }
        logined = true
    }
    id += "\n"
    let currentidpanel = GetElementByID("currentidpanel")
    currentidpanel.innerText = id
    if (!logined) {
        AddButton(currentidpanel, texts.clicktologin, function () {
            location.href = "https://steamcommunity.com/login/home/?goto="
        })
    } else {
        autoremindchatlog = await GetLocalValue("nextremind" + currentID, 0)
        let str = ""
        if (autoremindchatlog > 0) {
            str = texts.closeRemind
        } else {
            str = texts.openRemind
        }
        AddButton(currentidpanel, str, function () {
            if (autoremindchatlog > 0) {
                autoremindchatlog = 0
            } else {
                autoremindchatlog = 100
            }
            SaveLocalValue("nextremind" + currentID, autoremindchatlog)
            location.reload()
        })
        AddButton(currentidpanel, texts.setupgithubrepo, async function () {
            let empty: GitSettings = {
                tk: "", username: "", repo: ""
            }
            let v = await GetLocalValue("gh" + currentID, empty) as GitSettings
            let s1 = prompt(texts.inputgithubusername, v.username)
            if (s1 == null) {
                return
            }
            v.username = s1.trim()
            s1 = prompt(texts.inputgithubtoken, v.tk)
            if (s1 == null) {
                return
            }
            v.tk = s1.trim()
            s1 = prompt(texts.inputgithubrepo, v.repo)
            if (s1 == null) {
                return
            }
            v.repo = s1.trim()
            let str = texts.githubfinished
            if (v.repo.length < 1 || v.tk.length < 10 || v.username.length < 1) {
                str = texts.githubcanceled
                v = empty
            }
            await SaveLocalValue("gh" + currentID, v)
            await github.LoadTokenFromStorage()
            if (github.auth.length > 3) {
                github.ListBranchs().then(function (v) {
                    QuickNotice(texts.githubtestgood, texts.githubbranchtest + v.length.toString())
                }).catch(function (err) {
                    if (err == null) { err = "null" }
                    QuickNotice(texts.githubtestfail, texts.githuberror + err)
                })
            }
            alert(str)
        })
        let changelogpanel = GetElementByID("changelogpanel")
        let lastcheck = await GetLocalValue("lastchecklist" + currentID, 0)
        str = ""
        if (lastcheck < 1000) {
            str = texts.younevercheckedyourfriendslist
        } else {
            let passed = (new Date).getTime() - lastcheck
            passed /= 24 * 60 * 60 * 1000
            if (passed < 0.2) {
                str = texts.lastcheckflistislt5hours
            } else {
                str = texts.lastcheckflistisat + passed.toFixed(1) + texts.daysago
            }
        }
        str += "\n" + texts.iwouldcheckyourfriendslist + "\n"
        changelogpanel.innerText = str
        AddButton(changelogpanel, texts.checkflistatonce, function () {
            browser.runtime.sendMessage([Messages.gocheckfriendslist])
            changelogpanel.innerText = texts.refreshmelater
        }, true)
        AddButton(changelogpanel, texts.checkflistwithtest, function () {
            browser.runtime.sendMessage([Messages.gocheckfriendslist, "t1"])
            changelogpanel.innerText = texts.refreshmelater
        }, true)
        let v1 = await GetLocalValue("cs" + currentID, []) as FriendsChangeLog[]
        if (v1.length < 1) {
            changelogpanel.append("\n" + texts.nothinghere)
        } else {
            for (let i = v1.length - 1; i >= 0; i--) {
                let log = v1[i]
                let div = document.createElement("div")
                div.className = "changelogdiv"
                changelogpanel.appendChild(div)
                let span = document.createElement("span")
                span.className = "changelogtime"
                span.innerText = log.Time.toLocaleString()
                div.appendChild(span)
                if (log.gets.length > 0) {
                    log.gets.forEach(function (id) {
                        let a1 = document.createElement("a")
                        a1.className = "changeloggetid"
                        a1.href = "https://steamcommunity.com/profiles/" + id
                        a1.innerText = id
                        a1.target = "_blank"
                        div.appendChild(a1)
                    })
                }
                if (log.losts.length > 0) {
                    log.losts.forEach(function (id) {
                        let a1 = document.createElement("a")
                        a1.className = "changeloglostid"
                        a1.href = "https://steamcommunity.com/profiles/" + id
                        a1.innerText = id
                        a1.target = "_blank"
                        div.appendChild(a1)
                    })
                }
            }
        }
    }
})()

function AddButton(parent: HTMLElement, text: string, onclick: (this: HTMLButtonElement) => void, addline: boolean = false) {
    let button = document.createElement("button")
    parent.appendChild(button)
    button.innerText = text
    button.style.padding = "2px"
    button.style.margin = "2px"
    button.addEventListener("click", onclick)
    if (addline) {
        let br = document.createElement("br")
        parent.appendChild(br)
    }
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
                    let lastdownload = await GetLocalValue("downloadtime" + currentID, null)
                    if (lastdownload == null) {
                        str = texts.neverusedmetoexport
                    } else {
                        let dt = lastdownload as number
                        let passed = (new Date).getTime() - dt
                        passed /= 24 * 60 * 60 * 1000
                        if (passed < 0.2) {
                            str = texts.lastexportislt5hours
                        } else {
                            str = + passed.toFixed(1) + texts.daysago
                        }
                    }
                    if (autoremindchatlog > 0) {
                        str += "\n" + texts.youhavereminder
                    }
                    exportpanel.innerText = str + "\n"
                    AddButton(exportpanel, texts.clicktoexport, function () {
                        browser.runtime.sendMessage([Messages.startBGLogExport])
                        this.remove()
                    })
                }
            } else if (st == SteamChatLogDownloaderStat.downloading) {
                exportpanel.innerText = texts.reading + "\n" + texts.passedpages + strs[4] + " " + texts.messagescount + strs[2] + " " + texts.theoldestmessageisat + strs[3]
            } else if (st == SteamChatLogDownloaderStat.failed) {
                exportpanel.innerText = texts.githuberror + strs[2] + "\n"
                AddButton(exportpanel, texts.retry, function () {
                    browser.runtime.sendMessage([Messages.startBGLogExport])
                    this.remove()
                })
            } else if (st == SteamChatLogDownloaderStat.finished) {
                if (!asold) {
                    exportpanel.innerText = texts.finishedexport + "\n" + texts.passedpages + strs[4] + " " + texts.messagescount + strs[2] + " " + texts.theoldestmessageisat + strs[3]
                    AddButton(exportpanel, texts.csv1, function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "csvbom"])
                    })
                    AddButton(exportpanel, texts.csv2, function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "csv"])
                    })
                    AddButton(exportpanel, texts.json, function () {
                        browser.runtime.sendMessage([Messages.downloadBGLogExport, "json"])
                    })
                    AddButton(exportpanel, texts.redoexport, function () {
                        browser.runtime.sendMessage([Messages.startBGLogExport])
                        this.remove()
                    })
                }
            }
            return
        }
    }
})