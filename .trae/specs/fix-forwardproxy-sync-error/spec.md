# Fix forwardProxy 同步报错 Spec

## Why
用户触发同步时报「forwardProxy 请求失败」。抓包显示 GET `/actions/runs` 本身可成功（200、返回空列表），失败发生在另一次请求的发起阶段。根因：Forgejo 地址等设置值从文档/聊天中复制粘贴时混入了反引号（`` ` ``）等 markdown 格式字符，插件未清洗直接拼接 URL，内核 forwardProxy 无法发起请求；且失败提示只有固定文案，未包含实际请求 URL 与内核返回 msg，无法定位是哪个请求、什么原因失败。

## What Changes
- 新增设置值清洗：`forgejoUrl` / `forgejoRepo` / `forgejoToken` 在每次使用前去除首尾空白及反引号、引号字符（这些字符在 URL/仓库名/令牌中本就非法）；`forgejoUrl` 额外去除末尾斜杠；`workflowFile` 维持现有 trim
- 清洗应用于所有读取 Forgejo 设置的位置：`syncData`（同步链路）与 `CommitHistory` 组件 props（提交历史链路）
- 失败可定位：forwardProxy 返回 `code !== 0` 时，抛出的错误信息附加实际请求 URL 与内核 msg
- 不改变同步行为本身（dispatch → 轮询流程、终态判定均保持不变）

## Impact
- Affected specs: 无新增能力，属于 Actions runner 同步方案的缺陷修复
- Affected code: `src/sync/forgejo.ts`（清洗工具 + 错误信息）、`src/index.ts`（设置读取处应用清洗）

## ADDED Requirements

### Requirement: 设置值清洗
插件 SHALL 在使用 `forgejoUrl` / `forgejoRepo` / `forgejoToken` 发起请求前，去除首尾空白字符及反引号、引号字符；`forgejoUrl` 还 SHALL 去除末尾斜杠。

#### Scenario: 地址带反引号
- **WHEN** 用户在设置中粘贴了 `` `http://192.168.31.10:13333` ``（含反引号）
- **THEN** 实际请求 URL 为 `http://192.168.31.10:13333/api/v1/...`，不含反引号

#### Scenario: 正常配置不受影响
- **WHEN** 配置为干净的 `http://192.168.31.10:13333`
- **THEN** 同步与提交历史行为与现状一致

### Requirement: 失败错误可定位
forwardProxy 调用返回 `code !== 0` 时，插件 SHALL 抛出包含实际请求 URL 与内核 msg 的错误，并在 toast 中可见。

#### Scenario: 内核请求失败
- **WHEN** forwardProxy 返回 `code !== 0`
- **THEN** 错误信息形如 `forwardProxy 请求失败: <内核msg> (URL: <url>)`
