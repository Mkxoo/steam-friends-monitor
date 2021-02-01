
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
            if (this.status == 200) {
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
            } else {
                console.error(texts.cantlogin2)
                reject(texts.cantlogin2)
            }
        }
        x.send()
    })
    return p
}

// 判断是否真的丢失了这个好友
async function CheckIfRealLostFriend(id64: string): Promise<boolean> {
    if (id64.startsWith("23")) {
        return true
    }
    await Sleep(400)
    let p = new Promise<boolean>(function (resolve, rejct) {
        let x = new XMLHttpRequest
        x.open("GET", "https://steamcommunity.com/profiles/" + id64)
        x.onloadend = function () {
            if (this.status == 200) {
                if (this.responseText.includes("href=\"javascript:OpenFriendChat(")) {
                    resolve(false)
                    console.error("居然不是真的丢失了这个好友：", id64)
                } else {
                    resolve(true)
                }
            } else {
                console.error("请求出错，无法检测是否真的丢失好友：", id64, x.status)
                resolve(false)
            }
        }
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
                let realLost: string[] = []
                let fakeLost: string[] = []
                for (let i = 0; i < log.losts.length; i++) {
                    let id = log.losts[i]
                    let isreal = await CheckIfRealLostFriend(id)
                    if (isreal) {
                        realLost.push(id)
                    } else {
                        fakeLost.push(id)
                    }
                }
                log.losts = realLost
                if (fakeLost.length > 0) {
                    fakeLost.forEach(function (v) {
                        if (ov1.includes(v) == false) {
                            ov1.push(v)
                        }
                    })
                }
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
