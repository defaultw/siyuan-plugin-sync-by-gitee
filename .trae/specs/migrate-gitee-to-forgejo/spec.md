# Forgejo 适配 Spec

## Why
插件原存储位置为 Gitee，现改用自建 Forgejo 实例（`http://192.168.31.10:13333/wangxiaojiang`）。提交历史直接调用 Gitee API v5，无法访问 Forgejo；界面文案、配置项名称仍为 Gitee，需要全面适配。

## What Changes
- 提交历史数据源从 Gitee API v5 切换为 Forgejo API v1（`GET /api/v1/repos/{owner}/{repo}/commits`）
- 请求方式：通过思源内核 `/api/network/forwardProxy` 转发请求到 Forgejo API，避免浏览器 CORS 限制
- 认证方式：Forgejo 使用 `Authorization: token <token>` 请求头（替代 Gitee 的 `access_token` 查询参数）
- 新增设置项：`forgejoUrl`（Forgejo 地址，默认 `http://192.168.31.10:13333`）、`forgejoRepo`（仓库标识，默认 `wangxiaojiang/siyuan`）
- `giteeToken` 设置项更名为 `forgejoToken`（Gitee token 对 Forgejo 无效，不自动迁移，需用户重新填写）
- 配置迁移：首次加载时自动读取旧 `Gitee配置.json`，迁移同步地址/备注/请求校验 Token/分页条数到新配置 `Forgejo配置.json`
- i18n 文案更新：Gitee → Forgejo（zh_CN 与 en_US）
- 顶栏图标 `iconGiteeCommit` 更名为 `iconForgejoCommit`，SVG path 更换为 Forgejo/Gitea logo
- 同步触发机制（requestUrl 后端接口 + Shell 脚本）保持不变，仅更新文案
- **BREAKING**：配置文件从 `Gitee配置.json` 变为 `Forgejo配置.json`，旧配置仅一次性读取迁移

## Impact
- Affected specs: 插件配置、提交历史查询、同步触发、i18n
- Affected code:
  - `src/index.ts`（设置项、配置迁移、图标、dock 初始化传参）
  - `src/components/CommitHistory.svelte`（Forgejo API 调用、分页逻辑）
  - `public/i18n/zh_CN.json`、`public/i18n/en_US.json`（文案）
  - `plugin.json`（description 中的 Gitee 字样）
  - `README.md`、`README_zh_CN.md`（文档描述）

## ADDED Requirements

### Requirement: Forgejo 提交历史查询
系统 SHALL 通过内核 forwardProxy 请求 Forgejo API 获取提交历史。

#### Scenario: 成功获取提交历史
- **WHEN** 用户打开提交历史面板
- **THEN** 通过 `/api/network/forwardProxy` 请求 `{forgejoUrl}/api/v1/repos/{owner}/{repo}/commits?page=N&limit=M`，转发请求头携带 `Authorization: token <forgejoToken>`
- **AND** 解析返回的提交数组，显示提交信息、提交人、日期（zh-CN 格式化）
- **AND** 从 `x-total-count` 响应头计算总页数，支持"加载更多"分页
- **AND** 请求失败时在面板中显示错误提示，而不是静默失败

#### Scenario: URL 规范化
- **WHEN** `forgejoUrl` 配置值末尾带 `/` 或带子路径
- **THEN** 代码中自动去除末尾 `/` 后再拼接 API 路径，保证请求地址正确

#### Scenario: 配置缺失提示
- **WHEN** `forgejoUrl` 或 `forgejoRepo` 未配置
- **THEN** 提交历史面板显示"请先在设置中配置 Forgejo 地址和仓库"提示，不发起请求

### Requirement: Forgejo 配置项
系统 SHALL 提供 Forgejo 地址、仓库标识、Token 的可配置项。

#### Scenario: 配置面板展示
- **WHEN** 用户打开设置面板
- **THEN** 设置面板标题为"Forgejo配置"（i18n key `forgejoConfig`，配置文件名随之变为 `Forgejo配置.json`）
- **AND** 设置面板包含：Forgejo 地址（`forgejoUrl`）、仓库（`forgejoRepo`，格式 `owner/repo`）、Forgejo Token（`forgejoToken`）、同步地址（`requestUrl`）、同步备注（`requestMessage`）、请求校验 Token（`requestToken`）、提交记录每页显示条数（`commitHistoryPageSize`）
- **AND** 新增项带默认值：`forgejoUrl` 默认 `http://192.168.31.10:13333`，`forgejoRepo` 默认 `wangxiaojiang/siyuan`

### Requirement: 配置迁移
系统 SHALL 在首次加载新配置时自动从旧配置迁移。

#### Scenario: 旧配置自动迁移
- **WHEN** 新配置文件 `Forgejo配置.json` 读取结果为空（首次运行）且旧配置 `Gitee配置.json` 存在
- **THEN** 按以下映射迁移：`requestUrl` → `requestUrl`、`requestMessage` → `requestMessage`、`requestToken` → `requestToken`、`commitHistoryPageSize` → `commitHistoryPageSize`
- **AND** `giteeToken` 不迁移（Gitee token 对 Forgejo 无效），`forgejoToken` 留空由用户重新填写
- **AND** 迁移后立即保存新配置文件；旧文件保留不删除（回滚安全）

### Requirement: i18n 文案更新
系统 SHALL 将界面文案从 Gitee 更新为 Forgejo。

#### Scenario: 文案更新
- **WHEN** 配置面板/弹窗/状态栏展示文案
- **THEN** `giteeConfig` → `forgejoConfig`（"Forgejo配置" / "Forgejo configuration"）
- **AND** `giteeToken` → `forgejoToken`（"Forgejo token"，两种语言）
- **AND** `syncDesc` 文案 "同步到Gitee-说明" → "同步到Forgejo-说明" / "Synchronize to Forgejo- NOTE"
- **AND** `plugin.json` description 中 Gitee → Forgejo

### Requirement: 图标更名
系统 SHALL 将顶栏图标更名并更换为 Forgejo/Gitea 风格 logo。

#### Scenario: 图标更新
- **WHEN** 顶栏按钮渲染
- **THEN** icon symbol id `iconGiteeCommit` 更名为 `iconForgejoCommit`，SVG path 更换为 Forgejo/Gitea logo，顶栏引用同步更名

### Requirement: CommitHistory 组件参数
系统 SHALL 为 CommitHistory 组件传入 Forgejo 配置。

#### Scenario: 组件参数调整
- **WHEN** dock 初始化 CommitHistory 时
- **THEN** props 从 `accessToken` 改为 `forgejoUrl`、`forgejoRepo`、`forgejoToken`、`pageSize`，组件内部不再硬编码 Gitee URL

## MODIFIED Requirements

### Requirement: 同步触发保持不变
系统 SHALL 保持现有同步触发机制不变。

#### Scenario: 同步请求
- **WHEN** 用户点击同步并确认
- **THEN** 仍通过 `requestUrl?message=...` + `token` 请求头调用后端接口触发同步（逻辑不变，仅文案 Gitee→Forgejo）

## REMOVED Requirements

### Requirement: Gitee API 直连
**Reason**: 存储位置从 Gitee 更换为 Forgejo，Gitee API v5 不再可用
**Migration**: 替换为 Forgejo API v1 + 内核 forwardProxy 请求链路
