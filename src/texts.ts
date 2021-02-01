
let texts = {
    title: "Steam Friends Monitor",
    needlogin: "You didn't login steam in this browser. You should login first.",
    closeRemind: "Disable Backup Reminder",
    openRemind: "Enable Backup Reminder",
    clicktologin: "Goto Login",
    setupgithubrepo: "Setup github storage",
    inputgithubusername: "Please input your github username:",
    inputgithubtoken: "Please input your github personal token:",
    inputgithubrepo: "Please input your github repo's name:",
    githubfinished: "You have setup the github and I will make a test connection to github.",
    githubcanceled: "You didn't complete the github settings,that means the connection is now disabled.",
    githubtestgood: "Github Test Successfully!",
    githubtestfail: "Github Test Failed",
    githubbranchtest: "The branchs count in your repo:",
    githuberror: "Fail:",
    younevercheckedyourfriendslist: "You have never checked your steam friends list.",
    lastcheckflistislt5hours: "Last time I checked your steam friends list is less than 5 hours.",
    lastcheckflistisat: "Last time I checked your steam friends list is at ",
    daysago: " days ago",
    iwouldcheckyourfriendslist: "I will scan your friends list when the brower is opened.Once an hour.You can click the button below to start scan manually.",
    checkflistatonce: "Check steam friends list now",
    refreshmelater: "Please refresh this page later",
    checkflistwithtest: "Test button:lose 2 friends and get 2 friends",
    nothinghere: "Sorry,nothing here.",
    neverusedmetoexport: "You never export your chat log this before.",
    lastexportislt5hours: "The last time you export your chat log is less than 5 hours.",
    lastexportisat: "The last time you export chat log is at ",
    youhavereminder: "You have enabled the auto reminder.If you dont download chat log more than 6 days, i will send a notice to you.",
    clicktoexport: "Click me to export",
    reading: "Reading...",
    passedpages: "Read pages:",
    messagescount: "Message count: ",
    theoldestmessageisat: "The oldest message time:",
    retry: "Retry",
    finishedexport: "Finished export:",
    csv1: "Download CSV (for normal people, with UTF8BOM)",
    csv2: "Download CSV (keep original numbers,no BOM)",
    json: "Download JSON",
    redoexport: "Re do export",
    loginfail: "Login fail. It redirected to the login page.",
    goodbutnofriends: "Logged but no friends found in your account.",
    impossiblestr: "Impossible string shows. Work fail. Please retry.",
    cantlogin: "I cant login. No steamid is found.",
    cantlogin2: "Cant connect to steam ,maybe timeout.",
    losts: "Losts:",
    gets: "Gets:",
    ge: "person",
    yourflisthaschanged: "Notice: Your steam friends list have changed.",
    yourflistnochange: "Check over. Nothing is wrong with your steam friends list.",
    youallhave: "Now you have friends: ",
    errorwhencheckflist: "Error: cant check your friends list.",
    nochatlog: "Cant find any chat log",
    checkingindexpagefail: "I cant download the first page of the chat log.Maybe Timeout.",
    checkinglogfail: "I cant download some part of the chat log.Maybe Timeout.",
    nobackupbefore: "You hav't download your chat log this before.",
    haspassed: "has passed",
    days: "Days",
    youshouldexport: "Warning! You should download and backup your steam chat log.",
    failonmanualexport: "Error:Cant download your steam chat log.",
    clicktodownload: "Click to Download",
    manualjob: "Manual Job",
    failinbackgroundupload: "Uplaod to github failed,I will retry tomorrow.",
    autojob: "Upload to Github",
    yourarenow: "Your steam acount:",
    about: "About",
    madeby: "Made by Gordon Walkedby",
    sourcecode: "Source Code",
    exporttoyourpc: "Export your chat log (14 days from today)",
    yourchanges: "Your steam friends list changes",
    updatefound: "New Version Found!",
    goupdate: "Goto Download New Version",
    nextgithubupload: "Next time github upload is at:",
    uploading: "Uploading to github:",
    uploadover: "Uploading to github finished at ",
    githubmiss: "You didn't set up github.",
    startGithubUpload: "Start github upload at once.",
    githubstatus: "Sync to github"
};

let lang = window.navigator.language.toLowerCase()

if (lang.startsWith("zh")) {
    if (lang == "zh-cn" || lang == "zh-sg") {
        //简体中文
        texts.goupdate = "点我下载更新"
        texts.title = "Steam好友与聊天记录器"
        texts.needlogin = "尚未登录Steam，无法工作。请先去登录Steam，再回到本页面（需要刷新）。"
        texts.closeRemind = "关闭定期备份提醒"
        texts.openRemind = "开启定期备份提醒"
        texts.clicktologin = "点我去登录"
        texts.setupgithubrepo = "设置github云端存储"
        texts.inputgithubusername = "请输入你的 github 用户名："
        texts.inputgithubtoken = "请输入你的 github 个人 token："
        texts.inputgithubrepo = "请输入你要使用的 github repo："
        texts.githubfinished = "你填写了完整的github参数，现在我会做一次测试，如果测试成功您会看见结果。请稍等。"
        texts.githubcanceled = "你填写了不完整的github参数，视作断开与github的连接。"
        texts.githubtestgood = "Github 测试成功！"
        texts.githubtestfail = "Github 测试失败！"
        texts.githubbranchtest = "目前你的仓库里的分支的数量是："
        texts.githuberror = "错误返回："
        texts.younevercheckedyourfriendslist = "你从未检测过你的steam好友列表。"
        texts.lastcheckflistislt5hours = "上一次检查你steam好友列表是在不到5小时前。"
        texts.lastcheckflistisat = "上一次检查你steam好友列表是在"
        texts.daysago = "天前"
        texts.iwouldcheckyourfriendslist = "我会在你的浏览器开着的时候自动扫描你的steam好友列表，自动频率是浏览器开启一次，然后每个小时一次。您也可以点下面的按钮手动扫描。"
        texts.checkflistatonce = "立刻检测好友列表变化"
        texts.refreshmelater = "请在稍后刷新本页面"
        texts.checkflistwithtest = "假装丢失和新增了好友（测试）"
        texts.nothinghere = "抱歉，此处暂无信息。"
        texts.neverusedmetoexport = "您还从未通过我来导出您的steam聊天记录到本地"
        texts.lastexportislt5hours = "您上一次导出到本地是在不到5小时之前。"
        texts.lastexportisat = "您上一次导出到本地是在 "
        texts.youhavereminder = "您已开启自动提醒，如果你6天以上没有备份聊天记录到本地，我就会发一条推送提醒你。"
        texts.clicktoexport = "点我开始导出"
        texts.reading = "读取中。。。"
        texts.passedpages = "已读取页数："
        texts.messagescount = "共有信息条数："
        texts.theoldestmessageisat = "最早的消息位于："
        texts.retry = "重试"
        texts.finishedexport = "导出Steam聊天记录完成："
        texts.csv1 = "下载为CSV（普通人推荐，保留BOM）"
        texts.csv2 = "下载为CSV（保留原始数字，无BOM）"
        texts.json = "下载为JSON"
        texts.redoexport = "重新导出"
        texts.loginfail = "登录掉了！跳转到登录页了"
        texts.goodbutnofriends = "用户登录成功，却不包含任何好友"
        texts.impossiblestr = "出现了无法解析的字符串，请查看内部控制台"
        texts.cantlogin = "我找不到任何登录的id"
        texts.cantlogin2 = "无法登录steam，可能是因为超时"
        texts.losts = "失去："
        texts.gets = "新增："
        texts.ge = "个"
        texts.yourflisthaschanged = "注意：你的Steam好友列表发生了变化。"
        texts.yourflistnochange = "检测完毕，好友列表无变化！"
        texts.youallhave = "现在好友数量： "
        texts.errorwhencheckflist = "出错：STEAM好友列表检查失败！"
        texts.nochatlog = "查不到你的任何聊天记录"
        texts.checkingindexpagefail = "请求第一页聊天记录，返回非200或超时"
        texts.checkinglogfail = "多次访问聊天记录数据皆失败，可能是断网或登录掉了"
        texts.nobackupbefore = "您还没有备份过！"
        texts.haspassed = "已经过去了"
        texts.days = "天"
        texts.youshouldexport = "注意！你需要备份你的steam聊天记录！"
        texts.failonmanualexport = "出错：STEAM聊天记录手动任务获取失败！"
        texts.clicktodownload = "点我去下载。"
        texts.manualjob = "手动任务"
        texts.failinbackgroundupload = "后台上传聊天日志任务彻底失败，明天会继续重试："
        texts.autojob = "后台自动上传任务"
        texts.yourarenow = "你当前登录的steam是"
        texts.about = "关于"
        texts.madeby = "制作：戈登走過去"
        texts.sourcecode = "源代码"
        texts.exporttoyourpc = "手动导出所有的好友聊天记录到电脑（只支持最近14天）"
        texts.yourchanges = "你的好友列表变化动态"
        texts.updatefound = "发现新版本可更新！"
        texts.nextgithubupload = "下次自动github上传安排在："
        texts.uploading = "上传中："
        texts.uploadover = "上传完成于 "
        texts.githubmiss = "你还没有绑定github"
        texts.startGithubUpload = "立刻开始github上传"
        texts.githubstatus = "同步到Github"
    } else {
        texts.title = "Steam好友與聊天記錄器"
        texts.updatefound = "發現新版本可更新！"
        texts.goupdate = "點我下載更新"
        texts.needlogin = "尚未登錄Steam，無法工作。請先去登錄Steam，再回到本頁面（需要重新载入頁面）。"
        texts.closeRemind = "關閉定期備份提醒"
        texts.openRemind = "開啟定期備份提醒"
        texts.clicktologin = "點我去登錄"
        texts.setupgithubrepo = "設置github雲端存儲"
        texts.inputgithubusername = "請輸入你的 github 用戶名："
        texts.inputgithubtoken = "請輸入你的 github 個人 token："
        texts.inputgithubrepo = "請輸入你要使用的 github repo："
        texts.githubfinished = "你填寫了完整的github參數，現在我會做一次測試，如果測試成功您會看見結果。請稍等。"
        texts.githubcanceled = "你填寫了不完整的github參數，視作斷開與github的連接。"
        texts.githubtestgood = "Github 測試成功！"
        texts.githubtestfail = "Github 測試失敗！"
        texts.githubbranchtest = "目前你的倉庫裡的分支的數量是："
        texts.githuberror = "錯誤返回："
        texts.younevercheckedyourfriendslist = "你從未檢測過你的steam好友列表。"
        texts.lastcheckflistislt5hours = "上一次檢查你steam好友列表是在不到5小時前。"
        texts.lastcheckflistisat = "上一次檢查你steam好友列表是在"
        texts.daysago = "天前"
        texts.iwouldcheckyourfriendslist = "我會在你的瀏覽器開著的時候自動掃描你的steam好友列表，自動頻率是瀏覽器開啟一次，然後每個小時一次。您也可以點下面的按鈕手動掃描。"
        texts.checkflistatonce = "立刻檢測好友列表變化"
        texts.refreshmelater = "請在稍後刷新本頁面"
        texts.checkflistwithtest = "假裝丟失和新增了好友（測試）"
        texts.nothinghere = "抱歉，此處暫無訊息。"
        texts.neverusedmetoexport = "您還從未通過我來匯出您的steam聊天記錄到本地"
        texts.lastexportislt5hours = "您上一次匯出到本地是在不到5小時之前。"
        texts.lastexportisat = "您上一次匯出到本地是在 "
        texts.youhavereminder = "您已開啟自動提醒，如果你6天以上沒有備份聊天記錄到本地，我就會發一條推送提醒你。"
        texts.clicktoexport = "點我開始匯出"
        texts.reading = "讀取中。。。"
        texts.passedpages = "已讀取頁數："
        texts.messagescount = "共有訊息條數："
        texts.theoldestmessageisat = "最早的消息位於："
        texts.retry = "重試"
        texts.finishedexport = "匯出Steam聊天記錄完成："
        texts.csv1 = "下載為CSV（普通人推薦，保留BOM）"
        texts.csv2 = "下載為CSV（保留原始數字，無BOM）"
        texts.json = "下載為JSON"
        texts.redoexport = "重新匯出"
        texts.loginfail = "登錄掉了！跳轉到登錄頁了"
        texts.goodbutnofriends = "用戶登錄成功，卻不包含任何好友"
        texts.impossiblestr = "出現了無法解析的字符串，請查看內部控制台"
        texts.cantlogin = "我找不到任何登錄的id"
        texts.cantlogin2 = "無法登錄steam，可能是因為超時"
        texts.losts = "失去："
        texts.gets = "新增："
        texts.ge = "個"
        texts.yourflisthaschanged = "注意：你的Steam好友列表發生了變化。"
        texts.yourflistnochange = "檢測完畢，好友列表無變化！"
        texts.youallhave = "現在好友數量： "
        texts.errorwhencheckflist = "出錯：STEAM好友列表檢查失敗！"
        texts.nochatlog = "查不到你的任何聊天記錄"
        texts.checkingindexpagefail = "請求第一頁聊天記錄，返回非200或超時"
        texts.checkinglogfail = "多次訪問聊天記錄數據皆失敗，可能是斷網或登錄掉了"
        texts.nobackupbefore = "您還沒有備份過！"
        texts.haspassed = "已經過去了"
        texts.days = "天"
        texts.youshouldexport = "注意！你需要備份你的steam聊天記錄！"
        texts.failonmanualexport = "出錯：STEAM聊天記錄手動任務獲取失敗！"
        texts.clicktodownload = "點我去下載。"
        texts.manualjob = "手動任務"
        texts.failinbackgroundupload = "後台上傳聊天日誌任務徹底失敗，明天會繼續重試："
        texts.autojob = "後台自動上傳任務"
        texts.yourarenow = "你當前登錄的steam是"
        texts.about = "關於"
        texts.madeby = "製作：戈登走過去"
        texts.sourcecode = "源代碼"
        texts.exporttoyourpc = "手動匯出所有的好友聊天記錄到電腦（只支持最近14天）"
        texts.yourchanges = "你的好友列表變化動態"
        texts.updatefound = "發現新版本可更新！"
        texts.nextgithubupload = "下次自動github上傳安排在："
        texts.uploading = "上傳中："
        texts.uploadover = "上傳完成於 "
        texts.githubmiss = "你還沒有綁定github"
        texts.startGithubUpload = "立刻開始github上傳"
        texts.githubstatus = "同步到Github"
    }
} else if (lang == "ja") {
    texts.title = "Steamフレンドとメッセージ記録"
    texts.goupdate = "アップデートはこち！"
    texts.updatefound = "アップデートを利用はできます！"
    texts.needlogin = "Steamアカウントをログインしてください。"
    texts.closeRemind = "バックアップリマインダーを無効化にします"
    texts.openRemind = "バックアップリマインダーを有効化にします"
    texts.clicktologin = "ログイン"
    texts.setupgithubrepo = "githubストレージを配置します"
    texts.inputgithubusername = "githubユーザー名："
    texts.inputgithubtoken = "github個人トークン："
    texts.inputgithubrepo = "githubリポジトリ名："
    texts.githubfinished = "githubの配置を完成しました。githubにテスト接続を行います。"
    texts.githubcanceled = "githubの配置を完成していないため、接続は無効化されました。"
    texts.githubtestgood = "Githubテスト接続は成功しました！"
    texts.githubtestfail = "Githubテスト接続は失敗しました。"
    texts.githubbranchtest = "リポジトリブランチ数："
    texts.githuberror = "失敗しました："
    texts.younevercheckedyourfriendslist = "Steamフレンドリストをチェックしたことがありません。"
    texts.lastcheckflistislt5hours = "Steamフレンドリストをチェックしたのは5時間以内です。"
    texts.lastcheckflistisat = "Steamフレンドリストをチェックしたのは"
    texts.daysago = "日前です。"
    texts.iwouldcheckyourfriendslist = "ブラウザを開いた限り、Steamフレンドリストを1時間に1回チェックします。"
    texts.checkflistatonce = "いますぐSteamフレンドリストをチェックします"
    texts.refreshmelater = "後でこのページをリフレッシュしてください。"
    texts.checkflistwithtest = "テストボタン：2フレンドロストで2フレンド増えします。"
    texts.nothinghere = "ここは何もありません。"
    texts.neverusedmetoexport = "この前ではチャットログを書出したことはありません。"
    texts.lastexportislt5hours = "チャットログを書出したのは5時間以内です。"
    texts.lastexportisat = "チャットログを書出を書出したのは"
    texts.youhavereminder = "リマインダーを有効化したので、チャットログは6日以上ダウンロードしないと通知をします。"
    texts.clicktoexport = "書き出す"
    texts.reading = "読み込み中..."
    texts.passedpages = "読み込めたページ数："
    texts.messagescount = "メッセージ数："
    texts.theoldestmessageisat = "最も古いメッセージ："
    texts.retry = "リトライする"
    texts.finishedexport = "Steamチャットログの書き出しは完了しました。"
    texts.csv1 = "CSV形式でダウンロードします（Excelに互換性あり）"
    texts.csv2 = "CSV形式でダウンロードします（Excel以外に互換性あり）"
    texts.json = "JSON形式でダウンロードします"
    texts.redoexport = "もう一度で書き出す"
    texts.loginfail = "ログインできませんので、ログインページに向かいます。"
    texts.goodbutnofriends = "ログインできましたが、あなたのフレンド数は0です。"
    texts.impossiblestr = "正規式でnullが発生しましたので失敗しました。もう一度試してください。"
    texts.cantlogin = "Steam IDがないためログインできませんでした。"
    texts.cantlogin2 = "タイムアウトが原因で、Steamにログインできません"
    texts.losts = "ロスト："
    texts.gets = "ゲット："
    texts.ge = "パーソン"
    texts.yourflisthaschanged = "注意：Steamフレンドリストが変化しました。"
    texts.yourflistnochange = "Steamフレンドリストが変化していませんでした。"
    texts.youallhave = "いまのフレンズ："
    texts.errorwhencheckflist = "エラー：Steamフレンドリストをチェックできませんでした。"
    texts.nochatlog = "チャットログを見つけませんでした。"
    texts.checkingindexpagefail = "索引ページを読み込めませんからチェックできませんでした。タイムアウトかもしれません。"
    texts.checkinglogfail = "チャットログページを読み込めませんからチェックできませんでした。タイムアウトかもしれません。"
    texts.nobackupbefore = "この前ではチャットログをダウンロードしたことはありません。"
    texts.haspassed = "経過時間"
    texts.days = "日数"
    texts.youshouldexport = "警告：チャットログをダウンロードしてバックアップするのはお勧めです。"
    texts.failonmanualexport = "エラー：チャットログをダウンロードできませんでした。"
    texts.clicktodownload = "ダウンロード"
    texts.manualjob = "マニュアル"
    texts.failinbackgroundupload = "githubにアップロードできませんでしたので、明日でリトライします。"
    texts.autojob = "Githubにアップロードします"
    texts.yourarenow = "steamアカウント："
    texts.about = "開発者情報"
    texts.madeby = "Made by Gordon Walkedby"
    texts.sourcecode = "ソースコード"
    texts.exporttoyourpc = "Steamチャットログ書き出し（14日で1回）"
    texts.yourchanges = "Steamフレンドリストが変化"
    texts.nextgithubupload = "次のgithubアップロードは："
    texts.uploading = "アップロード中："
    texts.uploadover = "アップロード完成するまであと"
    texts.githubmiss = "githubの設置を終わりませんでしたから設置をお願いいたします。"
    texts.startGithubUpload = "いますぐgithubアップロードします"
    texts.githubstatus = "Githubに同期します"
};

(function () {
    let wbs = document.getElementsByTagName("wb")
    if (wbs.length > 0) {
        let f: any = texts
        for (let i = 0; i < wbs.length; i++) {
            let wb = wbs[i] as HTMLElement
            let s = f[wb.id]
            if (s != null) {
                wb.innerText = s
            } else {
                console.error("缺少翻译：", wb.id, wb)
            }
        }
    }
})()