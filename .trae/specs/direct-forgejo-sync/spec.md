# Direct Forgejo Sync Spec

## Why
当前插件同步仅通过第三方接口（requestUrl，配合服务器 auto_commit.sh 脚本）触发 git 提交，链路复杂且强依赖服务器脚本与 cron。用户需要同步思源笔记**全部文件**（/opt/siyuan 下 workspace/{conf,data,history,repo,temp}），希望插件**直连 Forgejo API** 完成提交，彻底移除第三方接口与服务器脚本依赖。

## What Changes
- **BREAKING** 移除 `requestUrl`、`requestToken` 设置项（第三方接口地址/Token），同步不再调用第三方接口
- 新增“全量文件同步”能力：插件通过思源内核 API（`/api/file/readDir`、`/api/file/getFile`）读取**工作区全部文件**（workspace 下 conf/data/history/repo/temp 所有内容），与 Forgejo 远端树（`GET /api/v1/repos/{owner}/{repo}/git/trees/{branch}?recursive=true`）对比，将差异文件经思源内核 forwardProxy 调用 Forgejo 批量内容接口 `POST /api/v1/repos/{owner}/{repo}/contents`（ChangeFiles）一次提交
- 新增本地/远端文件对比逻辑：本地按 git blob 规范计算 sha（`sha1("blob {size}\0{content}")`，SubtleCrypto 可实现），与远端 blob sha 对比，仅上传差异文件
- 新增删除同步：远端存在而本地不存在的文件，以 `operation: "delete"` 一并纳入同一提交（可配置开关，默认开启）
- 提交信息沿用现有 GitteCommitMessage 弹窗输入，缺省使用 `requestMessage` 设置
- 提交分批：当差异文件数量多或总体积大时，按批（如每批 50 个文件且请求体上限约 20MB）拆分为多次提交
- 设置界面新增 `syncScope` 相关配置（同步范围，默认 `workspace`；排除目录可配置，默认排除 `.git`、`temp`——temp 为思源临时目录，同步无意义且易频繁变化）与 `deleteRemote`（是否删除远端多余文件，默认开）
- 同步过程在状态栏 CommitStatus 展示进度（正在对比 / 正在提交 x/y 批）
- **移除**设置项 `requestUrl`、`requestToken` 及迁移逻辑中对应键；i18n 同步清理相关条目
- 保留 `requestMessage`、`commitHistoryPageSize`、Forgejo 配置项

## Impact
- Affected specs: migrate-gitee-to-forgejo（Forgejo 通道延续，本规格为其延伸）、direct-forgejo-sync（新增）
- Affected code:
  - `src/index.ts`：移除 requestUrl/requestToken 设置项、重写 syncData 逻辑
  - `src/api.ts`：新增 readDir/getFile（已有）封装、Forgejo trees/contents API 调用（forwardProxy）
  - `src/components/GitteCommitMessage.svelte`：保留
  - `src/components/CommitStatus.svelte`：进度展示增强（复用现有组件）
  - `public/i18n/zh_CN.json`、`public/i18n/en_US.json`：条目增删
  - 新文件：`src/sync/` 模块（遍历、diff、提交分批、git blob sha 计算）

## ADDED Requirements

### Requirement: 全量文件遍历
插件 SHALL 通过内核 API `/api/file/readDir` 从 `workspace/` 根开始递归遍历全部目录与文件，返回相对路径列表（POSIX 分隔符 `/`），并根据排除规则（默认 `.git`、`temp`）过滤。

#### Scenario: 递归遍历成功
- **WHEN** 同步流程启动且工作区文件可读
- **THEN** 返回 workspace 下（排除目录之外）所有文件相对路径列表，含二进制文件（图片、附件等）
- **THEN** 遍历进度/数量可从状态栏感知

#### Scenario: 排除目录生效
- **遍历遇到默认排除项（.git、temp）或用户配置的排除项**
- **THEN** 跳过这些目录，不读取、不上传

### Requirement: 本地文件读取与 git blob sha 计算
插件 SHALL 通过 `/api/file/getFile`（Blob 通道 `getFileBlob`）读取文件内容；二进制内容经 ArrayBuffer → base64；并按 git blob 规范计算本地 sha：`sha1(concat("blob " + byteLength + "\\0", content))`，用 SubtleCrypto `digest("SHA-1")` 实现。

#### Scenario: 文本文件读取
- **WHEN** 读取 .sy/.json/.md 等文件
- **THEN** 拿到二进制内容，正确转 base64 与 sha

#### Scenario: 二进制文件读取
- **WHEN** 读取 .png/.pdf 等二进制文件
- **THEN** 内容转 base64 与 sha 计算正确

#### Scenario: 读取失败容忍
- **WHEN** 某文件读取失败（如权限或竞态删除）
- **THEN** 跳过该文件并记录警告，不中断整体同步

### Requirement: 远端树获取与差异计算
插件 SHALL 通过 forwardProxy 调用 `GET /api/v1/repos/{owner}/{repo}/git/trees/{branch}?recursive=true`，获取远端全部 blob（path + sha），与本地文件 sha 对比得出：新增/修改（远端无该 path 或 sha 不同）、删除（远端有而本地无）。远端仓库根对应服务器 `/opt/siyuan`，本地工作区文件在远端的路径均带 `workspace/` 前缀；删除操作仅作用于 `workspace/` 子树（根下散文件插件不可达，不删除）；update/delete 操作 SHALL 携带远端原 blob sha。

#### Scenario: 无差异
- **WHEN** 本地与远端完全一致
- **THEN** 不发起 contents 提交，提示“无更改需要提交”

#### Scenario: 有差异
- **WHEN** 本地 N 个文件与远端不同
- **THEN** 生成 create/update/delete 操作列表，进入提交流程

### Requirement: 批量提交（ChangeFiles）
插件 SHALL 将差异文件按批次（每批默认 50 个文件，且累计 base64 体积上限约 20MB，达到任一上限即切批）通过 forwardProxy 调用 `POST /api/v1/repos/{owner}/{repo}/contents`（ChangeFiles，body 含 `branch`、`message`、`files[]`，每项 `{operation: "create"|"update"|"delete", path, content(base64)}`），按顺序提交，全部成功才算同步完成。

#### Scenario: 多批提交
- **WHEN** 差异文件超出一批上限
- **后端每批一次 commit，提交信息为用户输入 + 批次后缀（如 “ (2/3)”），全部成功后提示成功**
- **THEN** 用户输入的 message 用于所有批次

#### Scenario: 某批失败
- **WHEN** 某一批 contents 提交失败（网络/权限/冲突）
- **THEN** 立即停止后续批次，报错显示错误详情，已提交批次不回滚（与 git 语义一致）

### Requirement: 删除同步
插件 SHALL 提供 `deleteRemote` 配置（默认开启）：远端有而本地无的文件以 `operation: "delete"` 纳入提交；关闭后仅做新增/修改。

#### Scenario: 删除远端多余文件
- **WHEN** deleteRemote=true 且远端存在本地已不存在的文件
- **THEN** 该文件纳入 delete 操作，同批提交

#### Scenario: 关闭删除同步
- **两项删除开关关闭时，远端多余文件被保留，仅上传新增/修改**
- **THEN** 远端多余文件保留

### Requirement: 同步进度反馈
同步过程中 SHALL 在状态栏组件（CommitStatus）显示阶段与进度（对比中 / 正在提交第 x/y 批），结束后恢复隐藏；失败时显示错误消息。

#### Scenario: 进度展示
- **WHEN** 同步执行中
- **THEN** 状态栏显示当前阶段，全部完成后隐藏并 showMessage 成功/失败

## MODIFIED Requirements

### Requirement: 同步入口与提交信息
同步入口（顶栏菜单 + 快捷键 ⌘⌥G）保留 GitteCommitMessage 弹窗输入提交信息；缺省值取自 `requestMessage` 设置项。同步逻辑改为本规格的全量文件同步流程，**不再调用 requestUrl 第三方接口**。

#### Scenario: 弹窗同步
- **WHEN** 用户点击同步并输入 message 确认
- **THEN** 执行全量文件同步，message 作为 commit message（多批时加批次后缀）

#### Scenario: 快捷键同步
- **WHEN** 用户按快捷键触发且未配置 message 弹窗拦截
- **THEN** 使用 requestMessage 设置值作为 commit message 直接执行全量同步

## REMOVED Requirements

### Requirement: 第三方接口触发同步（requestUrl/requestToken）
**Reason**: 新流程插件直连 Forgejo API，第三方接口与服务器脚本（auto_commit.sh）不再需要，减少依赖。
**Migration**: 移除 `requestUrl`、`requestToken` 设置项与 i18n 条目；旧配置文件中的这两个键在迁移时忽略（不报错）。用户需改用 Forgejo 配置（forgejoUrl/forgejoRepo/forgejoToken）。

### Requirement: syncAddr/token i18n 条目
**Reason**: 对应设置项已移除。
**Migration**: zh_CN/en_US i18n 中 `syncAddr`、`syncAddrDesc`、`token`、`tokenDesc` 条目删除。
