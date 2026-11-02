# Tasks

- [x] Task 1: 新建同步核心模块 `src/sync/`
  - [x] SubTask 1.1: `src/sync/walk.ts` — 基于 `/api/file/readDir` 从 `workspace/` 递归遍历文件，支持排除目录（默认 `.git`、`temp`），返回 POSIX 相对路径列表
  - [x] SubTask 1.2: `src/sync/blob.ts` — 文件读取（`/api/file/getFile` Blob 通道）+ ArrayBuffer→base64 + git blob sha 计算（SubtleCrypto SHA-1，`sha1("blob {len}\0" + content)`）
  - [x] SubTask 1.3: `src/sync/forgejo.ts` — forwardProxy 封装 Forgejo API：`GET git/trees/{branch}?recursive=true`（拿全量 path+sha）、`POST contents`（ChangeFiles 批量提交），认证 `Authorization: token <token>`
  - [x] SubTask 1.4: `src/sync/diff.ts` — 本地/远端对比：新增/修改（sha 不同或远端无）、删除（远端有本地无，受 deleteRemote 开关控制）
- [x] Task 2: 同步编排器 `src/sync/sync.ts`
  - [x] SubTask 2.1: 串联遍历→读文件算 sha→取远端树→diff→分批（每批 ≤50 文件且 base64 累计 ≤20MB）→逐批 contents 提交（message 加批次后缀）
  - [x] SubTask 2.2: 进度回调（阶段：对比中/提交第 x/y 批）、失败即停、无差异提示
  - [x] SubTask 2.3: 单文件读取失败跳过并告警，不中断
- [x] Task 3: 接入 `src/index.ts`
  - [x] SubTask 3.1: 移除 `requestUrl`、`requestToken` 设置项及迁移列表中的对应键；保留 requestMessage/commitHistoryPageSize/Forgejo 配置
  - [x] SubTask 3.2: 重写 syncData：走新同步编排器，message 缺省取 requestMessage；CommitStatus 进度展示增强（阶段文案 + 结束/失败 showMessage）
- [x] Task 4: 设置与 i18n
  - [x] SubTask 4.1: 新增设置项 `deleteRemote`（是否删除远端多余文件，默认开）与 `syncExclude`（排除目录逗号分隔，默认 `.git,temp`）
  - [x] SubTask 4.2: zh_CN/en_US i18n：删 `syncAddr`、`syncAddrDesc`、`token`、`tokenDesc`；增 deleteRemote/syncExclude/进度相关文案
- [x] Task 5: 构建与验证
  - [x] SubTask 5.1: `npm run build` 通过，无 TS 报错
  - [x] SubTask 5.2: 代码走查确认：无 requestUrl/requestToken 残留引用、axios 依赖可移除则移除

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 2
- Task 4 与 Task 3 可并行（都依赖 Task 1/2 的接口形态）
- Task 5 depends on Task 3、Task 4
