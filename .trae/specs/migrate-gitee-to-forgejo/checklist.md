# Checklist

- [x] `iconGiteeCommit` symbol 更名为 `iconForgejoCommit`，SVG 为 Gitea/Forgejo logo，顶栏 `addTopBar` 引用同步更名
- [x] SettingUtils name 使用 `this.i18n.forgejoConfig`，配置文件为 `Forgejo配置.json`
- [x] 设置面板包含 `forgejoUrl`（默认 `http://192.168.31.10:13333`）、`forgejoRepo`（默认 `wangxiaojiang/siyuan`）、`forgejoToken`，顺序：地址、仓库、Token、同步地址、同步备注、请求校验 Token、每页条数
- [x] `giteeToken` 设置项已移除，不再被 dock 初始化引用
- [x] 配置迁移：新配置为空且旧 `Gitee配置.json` 存在时，迁移 requestUrl/requestMessage/requestToken/commitHistoryPageSize，迁移后保存，旧文件保留
- [x] CommitHistory props 为 `forgejoUrl`/`forgejoRepo`/`forgejoToken`/`pageSize`，无 `accessToken` 残留
- [x] CommitHistory 通过 `/api/network/forwardProxy` 请求 `{url}/api/v1/repos/{owner}/{repo}/commits?page=N&limit=M`，头 `Authorization: token <token>`
- [x] 从 `x-total-count` 响应头计算 totalPage，"加载更多"分页正常
- [x] `forgejoUrl` 尾部斜杠被规范化；未配置地址/仓库时面板显示提示且不发起请求
- [x] 请求失败时面板内显示错误提示
- [x] zh_CN/en_US i18n：`forgejoConfig`、`forgejoToken`、`syncDesc` 等文案中 Gitee 全部更新为 Forgejo
- [x] `plugin.json` 与 README/README_zh_CN 中 Gitee 描述更新为 Forgejo
- [x] `npm run build` 构建通过，无 TypeScript/Svelte 编译错误
