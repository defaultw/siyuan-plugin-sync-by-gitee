# Checklist

- [x] readDir 递归遍历 workspace 全部文件，排除目录（.git、temp 及用户配置）生效
- [x] 文件经 getFile Blob 读取，二进制正确转 base64，git blob sha（sha1("blob {len}\0" + content)）计算正确
- [x] 远端树 GET git/trees/{branch}?recursive=true 经 forwardProxy 调用，认证头 `Authorization: token <token>`
- [x] diff 结果：新增/修改/删除分类正确；deleteRemote 关闭时不产生 delete 操作
- [x] ChangeFiles 批量提交走 forwardProxy，分批（≤50 文件且 base64 累计 ≤20MB），多批 message 带批次后缀
- [x] 某批失败立即停止后续批次并显示错误；无差异时不提交并提示
- [x] 单文件读取失败跳过并告警，不中断整体同步
- [x] syncData 使用 GitteCommitMessage 弹窗 message（缺省 requestMessage），不再调用 requestUrl 第三方接口
- [x] 设置项 requestUrl、requestToken 已移除，迁移逻辑不再迁移这两个键；deleteRemote、syncExclude 设置项可用
- [x] i18n：syncAddr/syncAddrDesc/token/tokenDesc 已删除，新增文案齐全（zh_CN、en_US）
- [x] 状态栏 CommitStatus 展示同步阶段与批次进度，结束后恢复隐藏
- [x] npm run build 通过；代码中无 requestUrl/requestToken 残留引用
