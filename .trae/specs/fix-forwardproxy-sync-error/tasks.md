# Tasks

- [x] Task 1: 设置值清洗与错误定位
  - [x] SubTask 1.1: `src/sync/forgejo.ts` 新增 `sanitizeSetting`（去空白/反引号/引号）与 `sanitizeUrl`（另去末尾斜杠），`listRuns`/`dispatchWorkflow` 使用清洗后的值；`code !== 0` 时错误信息附加 URL 与内核 msg
  - [x] SubTask 1.2: `src/index.ts` 的 `syncData` 读取设置处应用清洗（forgejoUrl/forgejoRepo/forgejoToken）
  - [x] SubTask 1.3: `src/index.ts` 的 `CommitHistory` props（约 L276 forgejoUrl）应用清洗
  - [x] SubTask 1.4: `npm run build` 验证通过
