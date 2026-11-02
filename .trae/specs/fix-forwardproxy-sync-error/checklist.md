# Checklist

- [x] 设置中 forgejoUrl 含反引号/空白/末尾斜杠时，实际请求 URL 已清洗，请求可正常发出（syncData/CommitHistory 读取处 + listRuns/dispatchWorkflow 内部双重清洗）
- [x] forgejoRepo / forgejoToken 含反引号或引号时同样被清洗
- [x] forwardProxy code!==0 时错误信息包含实际 URL 与内核 msg（forgejo.ts listRuns/dispatchWorkflow）
- [x] 干净配置下同步与提交历史行为不变（清洗仅去除非法字符）
- [x] npm run build 通过（50 modules，dist/index.js 31.70 kB）
