# Fix workflow run 匹配失败（轮询卡住）Spec

## Why
用户同步实际已成功（服务器 commit 完成、run status=success），但插件状态栏停留在「服务器正在执行同步...」直到超时。实测用户 Forgejo 实例（v17）API 返回的 run JSON 与插件预期的 Gitea go-sdk 格式字段名不同：事件字段是 `trigger_event`（`event` 为空字符串）、workflow 标识是 `workflow_id`（无 `path`）、标题是 `title`（无 `display_title`）、无 `conclusion`（终态直接在 `status`）。`matchDispatchRun` 按 `event === "workflow_dispatch" && path.endsWith(workflowFile)` 匹配永远落空，轮询必然超时。

## What Changes
- `WorkflowRun` 接口适配双 schema：`event`/`trigger_event`、`path`/`workflow_id`、`display_title`/`title` 均为可选字段，`status` 必选
- `matchDispatchRun`：事件取 `trigger_event ?? event` 判定 workflow_dispatch；workflow 取 `workflow_id ?? path` 做后缀匹配
- 终态集合扩充：`success | failure | cancelled | canceled | skipped`
- 其余逻辑（基线 run id、轮询间隔/超时、错误处理）不变

## Impact
- Affected specs: fix-forgejo-response-unwrap（同步链路的延续修复）
- Affected code: `src/sync/forgejo.ts`（WorkflowRun 接口 + matchDispatchRun + FINAL_STATUSES）

## ADDED Requirements

### Requirement: 跨版本 run schema 兼容
插件 SHALL 同时兼容两种 run JSON schema（Gitea：event/path/display_title；Forgejo v17：trigger_event/workflow_id/title），正确匹配 workflow_dispatch 触发的目标 workflow run。

#### Scenario: Forgejo v17 schema 匹配
- **WHEN** 实例返回 `trigger_event="workflow_dispatch"`、`workflow_id="sync.yml"` 的 run
- **THEN** 轮询匹配该 run，`status="success"` 时正常结束并提示同步完成

#### Scenario: 旧版 Gitea schema 匹配
- **WHEN** 实例返回 `event="workflow_dispatch"`、`path=".forgejo/workflows/sync.yml"` 的 run
- **THEN** 同样正确匹配

#### Scenario: 终态判定
- **WHEN** 匹配到的 run.status 为 success/failure/cancelled/canceled/skipped 之一
- **THEN** 轮询立即返回该 run，不再等待下一轮
