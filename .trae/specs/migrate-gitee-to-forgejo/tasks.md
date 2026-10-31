# Tasks

- [x] Task 1: 重命名配置并新增 Forgejo 设置项（`src/index.ts`）
  - [x] 1.1 更换图标：`iconGiteeCommit` symbol 更名为 `iconForgejoCommit`，SVG path 换成 Gitea/Forgejo logo，顶栏引用同步更名
  - [x] 1.2 SettingUtils name 由 `this.i18n.giteeConfig` 修改为 `this.i18n.forgejoConfig`（配置文件变为 `Forgejo配置.json`）
  - [x] 1.3 新增设置项 `forgejoUrl`（默认 `http://192.168.31.10:13333`）与 `forgejoRepo`（默认 `wangxiaojiang/siyuan`）
  - [x] 1.4 `giteeToken` 项更名 `forgejoToken`（title/description 引用 i18n `forgejoToken`），调整添加顺序：Forgejo 地址、仓库、Token、同步地址、同步备注、请求校验 Token、每页条数
  - [x] 1.5 在 `settingUtils.load()` 前实现配置迁移：新配置为空且旧 `Gitee配置.json` 存在时，迁移 requestUrl/requestMessage/requestToken/commitHistoryPageSize 并立即保存

- [x] Task 2: CommitHistory 组件适配 Forgejo API（`src/components/CommitHistory.svelte`）
  - [x] 2.1 props 从 `accessToken` 改为 `forgejoUrl`/`forgejoRepo`/`forgejoToken`/`pageSize`
  - [x] 2.2 改用思源内核 `fetchSyncPost("/api/network/forwardProxy", ...)` 请求 `{forgejoUrl}/api/v1/repos/{owner}/{repo}/commits?page=N&limit=M`，请求头 `Authorization: token <forgejoToken>`
  - [x] 2.3 解析 Forgejo 提交数组（`commit.committer.name`、`commit.message`、`commit.committer.date`），从 `x-total-count` 头计算 totalPage
  - [x] 2.4 URL 尾部斜杠规范化；未配置 forgejoUrl/forgejoRepo 时显示提示且不请求
  - [x] 2.5 请求失败时面板内显示错误提示而非静默 console.error

- [x] Task 3: i18n 与元数据更新（`public/i18n/zh_CN.json`、`public/i18n/en_US.json`、`plugin.json`、README）
  - [x] 3.1 zh_CN/en_US：`giteeConfig`→`forgejoConfig`、`giteeToken`→`forgejoToken`、`syncDesc` Gitee→Forgejo
  - [x] 3.2 `plugin.json` description 与 README/README_zh_CN 中 Gitee → Forgejo

# Task Dependencies
- Task 2 依赖 Task 1 的设置项 key（forgejoUrl/forgejoRepo/forgejoToken）
- Task 3 独立，可与 Task 1、2 并行
