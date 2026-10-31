# Checklist

- [x] CommitHistory.svelte 中不存在硬编码浅色十六进制颜色（`#e4e4e4`、`#f6f6f6`、`#e0e0e0`、`#f0f0f0`、`white`、`black` 等全部移除）
- [x] 斑马纹与 hover 使用 `--b3-theme-surface` / `--b3-theme-background` 等 `--b3-theme-*` 叠加 `--b3-list-hover` fallback
- [x] 分页按钮使用 `b3-button b3-button--outline` 类，文字颜色继承主题（无 `color: black`）
- [x] 刷新按钮使用 `b3-button b3-button--outline` 类，移除白底黑字硬编码
- [x] 错误提示用 `--b3-theme-error`，加载提示继承主题文字色
- [x] `finally` 块缩进已修复，`parseInt` 已带 radix 参数 10
- [x] 黑色主题下面板显示对比度正常（全部颜色取自主题变量，随主题切换自适应）
- [x] 浅色主题下样式不劣化（保留斑马纹层次，b3-button 提供圆角与 hover）
- [x] `npm run build` 构建通过（88.00 kB），无 TypeScript/Svelte 编译错误
