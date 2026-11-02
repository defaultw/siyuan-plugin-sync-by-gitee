# Tasks

- [x] Task 1: run schema 兼容与匹配修复
  - [x] SubTask 1.1: `WorkflowRun` 接口改为双 schema 可选字段（trigger_event/workflow_id/title 与 event/path/display_title），FINAL_STATUSES 扩充 canceled
  - [x] SubTask 1.2: `matchDispatchRun` 改为 `trigger_event ?? event` + `workflow_id ?? path` 匹配
  - [x] SubTask 1.3: `npm run build` 验证通过
