# Steam好友与聊天记录器
This is a browser extension.
这是一个浏览器扩展。  
I can scan your steam friends list and tell you if anyone deletes you or someone adds you.And I can backup your chat log.It can be done by auto upload to your own github repo or manually download to your PC.    
我可以定期检查你的Steam好友列表是否有新增好友或者好友删除。也可以在后台帮您自动保存Steam聊天记录，支持下载聊天记录到本地或同步到github您自己的私人repo里。   

# 引用的第三方库
- [base64-js](https://github.com/beatgammit/base64-js)   

# Build 构建需要
- nodejs v14.15.4
- npm v6.14.10
- typescript V4.1.3
```powershell
npm install    #two @types packages are needed.
build_pack.ps1  #it use 7z to pack our ext.
```

# 特别鸣谢
- [0xAA55](https://www.0xaa55.com/)：提供了日语翻译，以及提供了让我活下去的地方，要不是她，我可能已经被父母送进精神病院长期不能接触电子设备了  
