# Fix forgejo 响应解包错误 Spec

## Why
插件所有 Forgejo 请求均报「forwardProxy 请求失败: 未知原因」，但手动调用同一接口成功。根因：`src/api.ts` 的 `request()` 已将 `IWebSocketData` 解包（返回 `response.data` 即 `IResForwardProxy` 或 `null`），而 `src/sync/forgejo.ts` 在解包后的对象上检查 `response.code !== 0`——字段不存在，`undefined !== 0` 恒为真，成功响应被误判为失败。`CommitHistory.svelte` 直连 `fetchSyncPost` 使用完整 `{code,msg,data}` 包裹结构故无此问题。

## What Changes
- **BREAKING**（仅内部）：`src/sync/forgejo.ts` 不再使用 `api.ts` 的 `forwardProxy` 封装，改为直连 `fetchSyncPost("/api/network/forwardProxy", ...)`（与 CommitHistory 一致），在完整包裹结构上判断 `code !== 0`，再从 `data` 取 `status`/`body`
- 抽取内部 `proxyRequest` 辅助函数统一错误处理：内核层失败（code≠0）抛含内核 msg 与 URL 的错误；Forgejo 层失败（HTTP status 非 2xx 预期值）抛含状态码与响应体的错误
- `listRuns`（预期 200）与 `dispatchWorkflow`（预期 204）改用该辅助函数，逻辑语义不变
- 同步流程（dispatch → 轮询）、设置清洗逻辑均不变

## Impact
- Affected specs: fix-forwardproxy-sync-error（前次修复的延续，本次修正其响应判断方式）
- Affected code: `src/sync/forgejo.ts`

## ADDED Requirements

### Requirement: 响应结构正确解包
`src/sync/forgejo.ts` SHALL 通过 `fetchSyncPost` 获取完整 `IWebSocketData`（`{code, msg, data}`），先判断内核层 `code !== 0`，再从 `data`（`IResForwardProxy`）取 `status` 与 `body` 判断 Forgejo 层结果。

#### Scenario: 请求成功
- **WHEN** forwardProxy 返回 code=0 且 data.status=200（runs 查询）或 204（dispatch）
- **THEN** 正常解析 body / 判定成功，不再误抛错误

#### Scenario: 内核层失败
- **WHEN** fetchSyncPost 返回 code≠0
- **THEN** 抛出含内核 msg 与请求 URL 的错误

#### Scenario: Forgejo 层失败
- **WHEN** data.status 非预期（如 401/404）
- **THEN** 抛出含 HTTP 状态码、响应体错误信息与 URL 的错误
