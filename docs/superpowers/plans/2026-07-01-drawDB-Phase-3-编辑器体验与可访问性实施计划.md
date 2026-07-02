# drawDB Phase 3 编辑器体验与可访问性实施计划

版本：2026-07-02

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 1. 阶段目标

Phase 3 的目标是在 Phase 0 安全底座、Phase 1 domain/persistence、Phase 2 import/export service 已稳定的基础上，提升首次进入、图表管理、菜单、快捷键、Issue 面板、响应式和 accessibility。

本阶段结束后，应满足：

- 首次进入 `/editor` 时，用户可以选择空白数据库、模板或导入路径。
- 返回用户默认恢复最近图，并能清楚看到本地恢复和保存状态。
- 本地图表列表展示数据库、表数量、关系数量、最近修改时间，并支持搜索、复制、删除、导出。
- 关键 icon-only button 有可访问名称，主要弹窗关闭后恢复焦点。
- landing、templates、editor、import dialog、share dialog 有 axe smoke 覆盖。
- 390px 移动端 landing 无横向溢出，Editor 移动端有明确体验提示或预览优先路径。
- 本地无账号新建、保存、刷新恢复仍然不依赖登录或后端。

## 2. 当前代码入口

- `src/pages/Editor.jsx`：当前 editor provider 组合入口。
- `src/components/Workspace.jsx`：当前负责加载、保存、路由、画布和主 UI 组合。
- `src/editor/useDiagramLoader.js`：Phase 1 已抽离本地 latest/by-id 加载。
- `src/editor/useDiagramPersistence.js`：Phase 1 已抽离本地保存组装。
- `src/persistence/localDiagramRepository.js`：Phase 1 已提供本地图表 CRUD。
- `src/components/EditorHeader/ControlPanel.jsx`：当前菜单、导入导出、保存、分享等动作集中入口。
- `src/components/EditorHeader/Modal/ImportDiagram.jsx`：JSON/DDB/DBML 导入弹窗。
- `src/components/EditorHeader/Modal/ImportSource.jsx`：SQL 导入弹窗。
- `src/components/EditorHeader/Modal/Share.jsx`：分享弹窗。
- `src/components/EditorSidePanel/Issues.jsx`：当前 issue 展示入口。
- `src/pages/LandingPage.jsx`：landing 页。
- `src/pages/Templates.jsx`：模板页。
- `src/test/e2e/app.smoke.spec.js`：当前 Playwright smoke 覆盖 landing、templates、editor。

## 3. 执行约束

- 每轮自动化最多做一个最小切片，不跨 Phase。
- 涉及代码行为必须 TDD：先写或更新失败测试，确认红灯，再实现，再跑聚焦和全量验证。
- 优先复用 Phase 1/2 已建立的 domain、repository、import/export service，不把业务逻辑重新塞回 React 组件。
- 本地无账号模式是硬约束；新建向导、图表管理、快捷键和 accessibility 改动不得引入登录前置。
- 浏览器流程改动必须运行 `npm run e2e`；UI/响应式任务还需要桌面和移动 smoke。
- Accessibility 任务应优先修复 serious/critical 问题，不用一次性追求所有 best-practice warning 清零。
- 所有新增文档使用中文文件名和中文正文，专业术语可保留英文。
- Phase 3 未通过退出门禁前，不进入 Phase 4 或 Phase 5。

## 4. Phase 3 切片队列

### 3.1 首次进入新建向导

状态：已完成。

目标：首次打开 `/editor` 且没有最近本地图表时，展示清晰的新建向导，提供空白数据库、模板、导入三条路径。

修改文件：

- 新增 `src/features/onboarding/NewDiagramWizard.jsx`
- 新增 `src/features/onboarding/NewDiagramWizard.test.jsx`
- 修改 `src/components/Workspace.jsx`
- 修改 `src/editor/useDiagramLoader.js`（仅在需要暴露 empty state 时）
- 修改 `src/test/e2e/app.smoke.spec.js`

步骤：

- [x] 写红灯测试，覆盖没有最近图时显示新建向导、选择数据库创建空白图、进入模板、进入导入。
- [x] 实现向导 UI，明确提示“默认保存到当前浏览器本地”。
- [x] 接入 `/editor` empty state，不影响有最近图的自动恢复路径。
- [x] 增加 Playwright smoke，覆盖无账号进入 editor 后可以看到或完成新建入口。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 新用户不需要登录即可从 `/editor` 创建第一个空白 diagram。
- 有最近图时仍按原路径恢复，不被新建向导打断。

验证记录：`npm run test -- src/features/onboarding/NewDiagramWizard.test.jsx src/editor/useDiagramLoader.test.jsx`、`npm run test`、`npm run e2e`、`npm run build` 已通过；桌面 1280px 和移动 390px 浏览器 smoke 确认新建向导可见、无横向溢出，创建空白图可跳转到 `/editor/diagrams/:id`。

### 3.2 最近图恢复提示与保存状态文案

状态：已完成。

目标：返回用户进入 `/editor` 时，Header 或工作区明确显示“已从本地恢复”和当前保存状态。

修改文件：

- 修改 `src/editor/useDiagramLoader.js`
- 修改 `src/editor/useDiagramPersistence.js`
- 修改 `src/components/EditorHeader/ControlPanel.jsx`
- 新增或修改相关测试

步骤：

- [x] 写红灯测试，覆盖本地 latest diagram 和 route diagram 恢复后暴露恢复来源。
- [x] 在 UI 中展示本地恢复和保存状态，不新增云端暗示。
- [x] 保存失败时保留可操作错误提示。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 用户能区分本地恢复、未保存、保存中、已保存、保存失败。
- 保存状态不依赖后端。

验证记录：`npm run test -- src/editor/useDiagramLoader.test.jsx src/editor/useDiagramPersistence.test.jsx`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build` 已通过；Header 新增“Restored from this browser / 已从本地恢复”本地恢复标签，本地保存异常会进入 `State.ERROR` 并显示保存失败文案。

### 3.3 Open modal 本地图表列表增强

状态：已完成。

目标：Open modal 展示数据库、表数量、关系数量、最近修改时间，并支持搜索、复制、删除、导出。

修改文件：

- 新增 `src/features/local-diagrams/LocalDiagramList.jsx`
- 新增 `src/features/local-diagrams/LocalDiagramList.test.jsx`
- 修改现有 Open modal 入口
- 修改 `src/persistence/localDiagramRepository.js`（仅补必要查询/复制 helper）

步骤：

- [x] 写红灯测试，覆盖图表列表字段、搜索、复制、删除确认、导出动作。
- [x] 实现列表组件，复用 local repository。
- [x] 删除必须二次确认，取消不改变 IndexedDB。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

验证记录：`npm run test -- src/features/local-diagrams/LocalDiagramList.test.jsx`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build` 已通过；Open modal 的本地图表区域新增搜索、数据库、表数量、关系数量、最近修改时间、复制、删除确认和 JSON 导出入口。

完成标准：

- 本地图表管理不再只是文件名列表。
- 删除和导出失败有明确反馈。

### 3.4 菜单配置与快捷键入口抽离

状态：已完成。

目标：把 `ControlPanel.jsx` 中的菜单结构和快捷键定义抽成可测试配置，为 accessibility 和后续重构减小入口复杂度。

修改文件：

- 新增 `src/editor/menuConfig.js`
- 新增 `src/editor/useEditorHotkeys.js`
- 新增相关测试
- 修改 `src/components/EditorHeader/ControlPanel.jsx`

步骤：

- [x] 写红灯测试，覆盖菜单项可见名称、禁用条件和快捷键描述。
- [x] 抽出菜单配置和快捷键 hook，保持现有行为。
- [x] 输入框、Monaco、Lexical 焦点内避免误触全局快捷键。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

验证记录：`npm run test -- src/editor/menuConfig.test.js src/editor/useEditorHotkeys.test.jsx`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high` 已通过；浏览器桌面和 390px 移动 smoke 已确认 editor 可打开且无横向溢出。`npm run e2e` 已改用 drawDB 专用默认端口，避免误复用其他项目的 dev server。

完成标准：

- 菜单和快捷键定义可被单元测试读取。
- 用户可发现核心快捷键，且不影响文本输入。

### 3.5 Icon button 可访问名称与焦点恢复

状态：已完成。

目标：清理主要工作流中的无名 icon-only button，并确保导入、分享、Open 等弹窗关闭后恢复触发按钮焦点。

修改文件：

- 修改 `src/components/EditorHeader/ControlPanel.jsx`
- 修改 `src/components/EditorHeader/Modal/*.jsx`
- 修改 `src/components/EditorCanvas/*` 中的 icon button（按最小范围）
- 新增 accessibility 相关测试

步骤：

- [x] 写红灯测试，扫描关键弹窗和 header 中的 icon-only button accessible name。
- [x] 补齐 `aria-label`、`aria-labelledby` 或可见文本，优先保持现有视觉设计。
- [x] 为主要弹窗补焦点恢复。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 关键 header 和弹窗操作按钮可被 `getByRole(..., { name })` 定位。
- 弹窗关闭后焦点回到合理触发点。

验证记录：红灯 `npm run e2e -- --grep "editor toolbar icon buttons"` 首次失败于 `Zoom out` 无可访问名称；实现后同一聚焦 e2e 已通过。浮动 toolbar 的 Zoom out、Zoom in、Undo、Redo、Add table、Add area、Add note、Save、Versions、Theme 已可按 role/name 定位；`ControlPanel` 会记录 Header/Menu 弹窗触发点，通用 Modal 关闭后恢复焦点。

### 3.6 Axe smoke 基线

状态：未开始。

目标：为 landing、templates、editor、import dialog、share dialog 建立 axe smoke，阻断 serious/critical accessibility 回归。

修改文件：

- 修改 `package.json`，增加 accessibility 脚本（如需要）。
- 新增 `src/test/e2e/accessibility.spec.js`
- 修改 `playwright.config.js`（仅在需要共享设置时）

步骤：

- [ ] 写红灯 e2e 测试，先覆盖一个页面的 axe serious/critical 检查。
- [ ] 安装或接入现有 axe Playwright 工具。
- [ ] 扩展到 landing、templates、editor、import dialog、share dialog。
- [ ] 运行 `npm run e2e`、accessibility 脚本、`npm run lint`、`npm run build`。

完成标准：

- serious/critical accessibility 问题会让门禁失败。
- 已知第三方 warning 不阻断，但必须记录。

### 3.7 Landing 390px 移动端横向溢出修复

状态：未开始。

目标：修复 390px 移动端 landing 横向溢出，确保首屏文本、按钮和媒体不重叠。

修改文件：

- 修改 `src/pages/LandingPage.jsx`
- 修改相关 CSS/Tailwind class
- 修改或新增 Playwright 视觉/布局 smoke

步骤：

- [ ] 写红灯 Playwright 测试，验证 390px 宽度下 `document.documentElement.scrollWidth <= innerWidth`。
- [ ] 调整 landing 响应式布局和长文本换行。
- [ ] 桌面视口 smoke，确认没有破坏首屏入口。
- [ ] 运行 `npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 390px viewport 无横向滚动。
- 桌面 landing 仍能清楚进入 editor/templates。

### 3.8 Editor 移动端体验提示

状态：未开始。

目标：移动端进入 Editor 时提供清晰提示或预览优先路径，避免用户误以为完整画布体验已为小屏优化。

修改文件：

- 修改 `src/components/Workspace.jsx`
- 新增或修改响应式测试

步骤：

- [ ] 写红灯测试，覆盖移动端 editor 显示体验提示，桌面端不显示。
- [ ] 实现移动端提示或预览优先布局，不阻断本地打开。
- [ ] 确认导入/导出/保存关键入口仍可访问或有清晰降级说明。
- [ ] 运行 `npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 小屏用户看到明确状态和下一步。
- 桌面 editor 体验不回退。

## 5. Phase 3 退出门禁

Phase 3 所有切片完成后必须运行：

```bash
npm run lint
npm run test
npm run e2e
npm run build
git diff --check
npm audit --audit-level=high
```

如本阶段新增独立 accessibility 脚本，还必须运行：

```bash
npm run accessibility
```

退出标准：

- 首次进入新建向导、最近图恢复、本地图表列表、导入/分享弹窗主流程均有测试或 e2e smoke。
- axe smoke 对 landing、templates、editor、import dialog、share dialog 无 serious/critical 问题。
- 390px landing 无横向溢出。
- 关键 icon-only button 有可访问名称。
- 弹窗关闭后恢复焦点。
- 本地无账号 editor 创建、保存、刷新恢复无回归。

## 6. 下一轮默认任务

下一轮自动化默认执行 Phase 3.6 Axe smoke 基线。
