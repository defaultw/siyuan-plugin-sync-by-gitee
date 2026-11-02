# Checklist

- [x] forgejo.ts 使用完整 IWebSocketData 结构判断 code!==0，不再对解包对象检查 .code（已改直连 fetchSyncPost + proxyRequest 辅助函数）
- [x] listRuns：code=0 且 data.status=200 时正确解析 workflow_runs；data.status≠200 抛含状态码与 body 的错误
- [x] dispatchWorkflow：code=0 且 data.status=204 时判定成功；否则抛含状态码的错误
- [x] 错误信息均含请求 URL；清洗逻辑与同步流程不变（grep 确认 src/sync 内无 api.ts forwardProxy 残留引用）
- [x] npm run build 通过（49 modules，dist/index.js 31.50 kB）
