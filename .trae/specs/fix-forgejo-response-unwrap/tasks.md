# Tasks

- [x] Task 1: 修正 forgejo.ts 响应解包
  - [x] SubTask 1.1: `src/sync/forgejo.ts` 改为直连 `fetchSyncPost`，新增 `proxyRequest` 辅助函数（code!==0 → 抛含 msg+URL；返回 `data` 为 IResForwardProxy）
  - [x] SubTask 1.2: `listRuns` 与 `dispatchWorkflow` 改用 `proxyRequest`，在 `data.status` 上判断 200/204，body 从 `data.body` 解析
  - [x] SubTask 1.3: `npm run build` 验证通过
