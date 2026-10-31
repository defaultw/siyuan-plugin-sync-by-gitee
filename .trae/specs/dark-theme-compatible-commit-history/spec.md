# 提交历史页面黑色主题兼容适配 Spec

## Why
提交历史查询页面（CommitHistory.svelte）中大量使用硬编码浅色颜色（斑马纹 `#e4e4e4`/`#f6f6f6`、hover `#e0e0e0`、按钮黑字、刷新按钮白底黑字等），在黑色主题下显示异常（白底刺眼、文字对比度不足）。其他使用 `--b3-*` 变量或 siyuan-kit 组件的组件均正常，唯 CommitHistory 需要适配。

## What Changes
- CommitHistory.svelte 样式改用思源 CSS 变量（`--b3-theme-*` 系列）实现明暗主题自适应
- 移除全部硬编码颜色：斑马纹 `#e4e4e4`/`#f6f6f6`、hover `#e0e0e0`、按钮黑字 `color: black`、刷新按钮白底黑字
- 顺手修复源文件中 `finally` 块的缩进瑕疵（仅缩进，无逻辑变更）
- 顺手修复 `parseInt` 的 radix 参数缺失（`parseInt(x, 10)`）
- 分页/刷新按钮改用思源 b3 类（`b3-button b3-button--outline`）以完整继承主题样式
- GitteCommitMessage/CommitStatus/setting-panel 等组件已使用主题变量或 siyuan-kit 组件，无需修改

## Impact
- Affected specs: 无既有规格受影响；新增独立 UI 适配规格
- Affected code: 仅 `src/components/CommitHistory.svelte`（`<style>` 块为主，script 部分仅缩进与 radix 修复）

## MODIFIED Requirements
### Requirement: 提交历史 UI 主题自适应
提交历史页面 SHALL 使用思源主题 CSS 变量（`--b3-theme-*`）渲染所有背景色、文字色与 hover 效果，并 SHALL NOT 包含任何硬编码的浅色主题十六进制颜色。

#### Scenario: 黑色主题下正常显示
- **WHEN** 用户在思源笔记中启用黑色主题并打开提交历史 dock 面板
- **THEN** 面板背景/斑马纹/hover/按钮均使用 `--b3-theme-*` 变量渲染，文字与背景对比度正常，无白底白字或低对比度问题

#### Scenario: 浅色主题回归正常
- **WHEN** 用户使用浅色主题打开提交历史 dock 面板
- **THEN** `--b3-theme-*` 变量在浅色主题下解析为浅色值，显示效果保持层次感（斑马纹/hover/按钮），不劣化于原有浅色外观
