// github api 
const githubapi = "https://api.github.com"
const githubaccept = "application/vnd.github.v3+json"
const github = {
    auth: "",
    username: "",
    repo: "",
    async LoadTokenFromStorage() {
        this.auth = ""
        this.username = ""
        this.repo = ""
        if (currentID.length != id64len) {
            return
        }
        let v = await GetLocalValue("gh" + currentID, null)
        if (v == null) { return }
        let sets = v as GitSettings
        if (sets.repo.length < 1 || sets.tk.length < 10 || sets.username.length < 2) {
            return
        }
        let str = ""
        str = btoa(sets.username + ":" + sets.tk)
        this.auth = "Basic " + str
        this.username = sets.username
        this.repo = sets.repo
        console.log("github登记成功", this.username, this.repo)
    },
    async GetOnlineFileSHA(path: string): Promise<string> {
        // 获取一个在线文件的sha，如果在线文件不存在，就返回""
        let x = new XMLHttpRequest
        x.open("GET", githubapi + `/repos/${this.username}/${this.repo}/contents/${path}`)
        x.setRequestHeader("Accept", githubaccept)
        x.setRequestHeader("Authorization", this.auth)
        x.timeout = 5000
        console.log("github 尝试读取文件sha ", path)
        let p = new Promise<string>(function (resolve, reject) {
            x.onloadend = function () {
                if (this.status == 200) {
                    let jj = this.responseText
                    let obj = JSON.parse(jj)
                    let type = obj.type
                    if (type == "file") {
                        let s = obj.sha as string
                        console.log("github 成功获取sha", path, s)
                        resolve(s)
                    }
                    else {
                        console.log("github 成功获取sha：文件不存在", path)
                        resolve("")
                    }
                } else if (this.status == 404) {
                    resolve("")
                }
                else {
                    reject(this.status.toString())
                }
            }
            x.send()
        })
        return p
    },
    async CreateOrUpdateTextFile(path: string, content: string, sha: string) {
        let x = new XMLHttpRequest
        x.open("PUT", githubapi + `/repos/${this.username}/${this.repo}/contents/${path}`)
        x.setRequestHeader("Accept", githubaccept)
        x.setRequestHeader("Authorization", this.auth)
        x.timeout = 5000
        console.log("github 尝试上传或更新文件 ", path, content.length, sha)
        let p = new Promise<void>(function (resolve, reject) {  
            x.onloadend = function () {
                if (this.status == 200 || this.status == 201) {
                    console.log("github 上传成功", path, this.status)
                    resolve()
                } else {
                    reject(this.status.toString())
                }
            }
            let dt = (new Date).toLocaleString()
            let enc = new TextEncoder()
            let b64 = base64js.fromByteArray(enc.encode(content))
            let data: GitHubUpdateBody = {
                message: dt, content: b64
            }
            if (sha.length > 1) {
                data.sha = sha
            }
            x.send(JSON.stringify(data))
        })
        return p
    },
    async ListBranchs(): Promise<string[]> {
        let x = new XMLHttpRequest
        x.open("GET", githubapi + `/repos/${this.username}/${this.repo}/branches`)
        x.setRequestHeader("Accept", githubaccept)
        x.setRequestHeader("Authorization", this.auth)
        x.timeout = 5000
        console.log("github 尝试读取仓库的分支列表 ")
        let p = new Promise<string[]>(function (resolve, reject) {
            x.onloadend = function () {
                if (this.status == 200) {
                    let out: string[] = []
                    let jj = this.responseText
                    let obj = JSON.parse(jj) as Array<any>
                    obj.forEach(function (v) {
                        out.push(v.name)
                    })
                    resolve(out)
                }
                else {
                    reject(this.status.toString())
                }
            }
            x.send()
        })
        return p
    }
}