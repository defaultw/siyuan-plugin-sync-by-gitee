# Checklist

- [x] WorkflowRun 兼容两种 schema 字段（trigger_event/event、workflow_id/path、title/display_title）
- [x] matchDispatchRun 对用户实例实际响应（trigger_event="workflow_dispatch"、workflow_id="sync.yml"、status="success"）可正确匹配并终止轮询
- [x] FINAL_STATUSES 含 success/failure/cancelled/canceled/skipped
- [x] 基线 id、轮询间隔/超时逻辑不变
- [x] npm run build 通过
