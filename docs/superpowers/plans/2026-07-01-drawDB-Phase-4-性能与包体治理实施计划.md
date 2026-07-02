# drawDB Phase 4 性能与包体治理实施计划

版本：2026-07-02

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 1. 阶段目标

Phase 4 的目标是在 Phase 0 安全底座、Phase 1 domain/persistence、Phase 2 import/export service、Phase 3 editor UX/accessibility 已通过退出门禁的基础上，治理首屏 bundle、重型依赖加载时机和大图编辑性能。

本阶段结束后，应满足：

- 构建产物有可重复的 bundle budget 检查，主 bundle 超预算会阻断门禁。
- Monaco、SQL parsers、image/PDF export libraries、tweet/social widgets 已从首屏主 chunk 拆出或延迟加载。
- build 前后 chunk size 有记录，Phase 4 的优化收益可审计。
- 100、500、1000 表性能 fixtures 存在并可复用。
- 500 表图可以打开、搜索、定位，1000 表图至少可以打开、查看结构和导出。
- 本地无账号 editor 创建、保存、刷新恢复、导入导出和分享不可用提示不回归。

## 2. 当前代码入口

- `src/App.jsx`：当前路由入口，适合评估页面级 lazy loading。
- `src/pages/LandingPage.jsx`：当前延迟加载 tweet/social widgets，并仍直接加载 hero canvas 和多个静态资源。
- `src/pages/Templates.jsx`：模板页面包含截图和模板浏览入口。
- `src/components/Workspace.jsx`：editor 主工作区和 provider 组合后的主要交互入口。
- `src/components/EditorCanvas/Canvas.jsx`：画布渲染与交互入口。
- `src/components/EditorCanvas/Table.jsx`：表节点渲染入口。
- `src/components/EditorHeader/Modal/Modal.jsx`：导入、导出、设置、分享等弹窗承载入口。
- `src/components/CodeEditor/index.jsx`：Monaco 代码编辑器入口。
- `src/features/import/`：SQL/DBML/JSON/DDB 导入 service。
- `src/features/export/`：SQL/DBML/Markdown/Mermaid/image/PDF 导出 facade。
- `vite.config.js`：构建配置入口。
- `playwright.config.js`：浏览器 smoke 和 future performance smoke 入口。

## 3. 执行约束

- 每轮自动化最多做一个最小切片，不跨 Phase。
- 涉及代码行为必须 TDD：先写或更新失败测试，确认红灯，再实现，再跑聚焦和全量验证。
- 性能优化必须保留本地无账号核心流程，不允许以禁用功能换取 bundle 下降。
- 先建立可审计 baseline，再做懒加载或 memo 优化，避免无法判断收益。
- 懒加载重型依赖时必须有 loading、error 或 fallback 状态，不能让弹窗空白。
- 大图优化优先减少不必要的渲染和加载成本；不要在本阶段引入新的大型画布引擎或重写交互架构。
- Phase 4 未通过退出门禁前，不进入 Phase 5。

## 4. Phase 4 切片队列

### 4.1 Bundle budget 脚本与构建基线记录

状态：已完成。

目标：新增可重复执行的 bundle budget 检查脚本，记录当前 build chunk baseline，并把主 chunk 过大治理纳入后续切片。

修改文件：

- 新增 `scripts/check-bundle-budget.mjs`
- 修改 `package.json`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试或脚本 smoke，覆盖缺少 `dist` 或主 chunk 超出预算时返回非 0。（Phase 4.1 已完成，`src/build/bundleBudget.test.js` 覆盖缺 build、超预算和预算内输出。）
- [x] 新增 `npm run bundle:check`，读取 `dist/assets` 的 JS/CSS 文件大小并输出最大 chunk 摘要。（Phase 4.1 已完成。）
- [x] 先按当前 build 结果设置宽松 Phase 4 baseline，后续切片逐步收紧。（Phase 4.1 已完成，当前预算为 JS <= 17000 KB、CSS <= 450 KB、total <= 18000 KB。）
- [x] 在验证矩阵记录当前 chunk size、已知 `lottie-web` direct eval 和主 chunk 过大警告。（Phase 4.1 已完成，当前最大 JS chunk 16271.88 KB，最大 CSS 404.78 KB，JS/CSS 总量 17044.63 KB。）
- [x] 运行 `npm run build`、`npm run bundle:check`、`npm run lint`、`npm run test`、`git diff --check`、`npm audit --audit-level=high`。（Phase 4.1 已完成并记录到 run log。）

完成标准：

- `npm run bundle:check` 可以在 build 后稳定运行。
- 未 build 或超预算会给出明确错误。
- baseline 不伪装成优化完成，只作为后续收紧依据。

### 4.2 Monaco 按需加载

状态：已完成。

目标：Monaco 只在 code/import/export/DBML 相关面板打开时加载，减少 editor 初始 bundle 压力。

修改文件：

- 修改 `src/components/CodeEditor/index.jsx`
- 新增 `src/components/CodeEditor/LazyMonaco.jsx`
- 修改 `src/components/EditorHeader/SideSheet/Migration.jsx`
- 新增 `src/build/monacoLazyBoundary.test.js`

步骤：

- [x] 写红灯测试，覆盖未打开代码编辑器入口时不加载 Monaco chunk。（Phase 4.2 已完成，`src/build/monacoLazyBoundary.test.js` 先确认 `CodeEditor` 静态导入 Monaco 后红灯。）
- [x] 将 Monaco 包装成 lazy/dynamic import，并提供稳定 loading 状态。（Phase 4.2 已完成，`LazyMonaco.jsx` 统一提供 Editor、DiffEditor 和 fallback。）
- [x] 确认 Import SQL、DBML 视图和 export 相关代码编辑流程仍可用。（Phase 4.2 已完成，Import SQL、DBML、export code modal 仍走 `CodeEditor`，Migration diff 改用 lazy DiffEditor。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`。（Phase 4.2 已完成并记录到 run log。）

完成标准：

- 初始 editor 进入不阻塞在 Monaco 加载。
- 打开相关功能时编辑器可用，错误状态可见。

### 4.3 SQL parsers 按需加载

状态：已完成。

目标：SQL parser 只在 SQL import 或相关导出能力触发时加载，不进入无关首屏路径。

修改文件：

- 修改 `src/features/import/importSqlService.js`
- 修改 `src/utils/importSQL/*`
- 修改 SQL 导入弹窗测试

步骤：

- [x] 写红灯测试，覆盖 SQL import service 可以等待动态 parser 并返回原有 `{ ok, diagram, preview, issues }` contract。（Phase 4.3 已完成，`src/build/sqlParserLazyBoundary.test.js` 先捕获静态 parser import，`importSqlService.test.js` 已改为 async contract。）
- [x] 将 dialect parser 加载边界集中到 import service，避免 UI 直接感知 parser 细节。（Phase 4.3 已完成，`importSqlText` 动态加载 `node-sql-parser` 和 `oracle-sql-parser`，`ImportSource` 只等待 service result。）
- [x] 保留 parser error、unsupported statement warning 和超限输入保护。（Phase 4.3 已通过既有 SQL import service 测试覆盖。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`。（Phase 4.3 已完成并记录到 run log。）

完成标准：

- 非 SQL import 路径不加载 SQL parser。
- SQL import 失败不会清空当前图。
- 当前 build 将 `node-sql-parser` 和 `oracle-sql-parser` 拆为独立 chunk，主 JS chunk 降至约 13682.29 KB。

### 4.4 Image/PDF export libraries 按需加载

状态：已完成。

目标：`html-to-image`、`jspdf` 等导出重型依赖只在对应导出动作触发时加载。

修改文件：

- 修改 `src/features/export/exportDiagramService.js` 或对应 facade
- 修改 `src/utils/exportAs/*`
- 修改导出相关测试

步骤：

- [x] 写红灯测试，覆盖 image/PDF export facade 在动态依赖加载成功和失败时的结果。（Phase 4.4 已完成，新增 `src/build/exportLibrariesLazyBoundary.test.js` 并扩展 `exportDiagramService.test.js`。）
- [x] 将重型依赖动态导入，失败时返回可展示 error。（Phase 4.4 已完成，`html-to-image` 和 `jspdf` 不再顶层静态导入。）
- [x] 保留 Markdown、Mermaid、SQL、DBML 导出稳定路径。（Phase 4.4 已通过全量测试覆盖。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`。（Phase 4.4 已完成并记录到 run log。）

完成标准：

- 未触发 image/PDF export 时不加载对应库。（Phase 4.4 已完成，静态边界测试覆盖 service 和 Header entry。）
- 触发后导出行为和错误提示保持稳定。（Phase 4.4 已完成，动态加载成功/失败和注入 adapter 路径均有测试。）

### 4.5 Landing tweet/social widgets 延迟加载

状态：已完成。

目标：Landing 首屏不被 tweet/social widgets 阻塞，外部内容延迟到用户滚动到相关区域后加载。

修改文件：

- 修改 `src/pages/LandingPage.jsx`
- 新增或修改 Playwright smoke

步骤：

- [x] 写红灯测试，覆盖首屏 CTA 可见且 tweet widget 延迟加载。（Phase 4.5 已完成，新增 `src/build/landingSocialLazyBoundary.test.js` 和 Playwright landing social smoke。）
- [x] 使用 viewport 或交互触发延迟加载，并提供稳定占位。（Phase 4.5 已完成，`LandingTweets` 使用 `IntersectionObserver` 触发 `react-tweet` 动态加载，并提供 loading/error fallback。）
- [x] 确认 390px 移动端无横向溢出。（Phase 4.5 已通过全量 e2e 覆盖既有 390px landing smoke。）
- [x] 运行 `npm run e2e`、`npm run accessibility`、`npm run lint`、`npm run build`、`npm run bundle:check`。（Phase 4.5 已完成并记录到 run log。）

完成标准：

- Landing 首屏入口不依赖 tweet widget。
- 390px landing 仍无横向滚动。
- 当前 build 将 `react-tweet` runtime 拆为独立按需 chunk，主 JS chunk 降至约 13248.74 KB。

### 4.6 大图 performance fixtures

状态：未开始。

目标：新增 100、500、1000 表 diagram fixtures，为后续大图加载、搜索和导出 smoke 提供稳定输入。

修改文件：

- 新增 `src/test/fixtures/performance/`
- 新增 fixture generator 或 README
- 新增相关 fixture 测试

步骤：

- [ ] 写红灯测试，覆盖性能 fixture 的表数量、关系数量和 schema shape。
- [ ] 生成或维护 deterministic fixtures，避免提交随机数据。
- [ ] 记录 fixture 使用方式和边界。
- [ ] 运行聚焦测试、`npm run test`、`git diff --check`。

完成标准：

- 100/500/1000 表 fixtures 可被测试和 e2e 复用。
- fixtures 不依赖外部服务或当前浏览器状态。

### 4.7 Canvas/Table 稳定 props 与 memo 基线

状态：未开始。

目标：先对 table、relationship、note、area 等高频渲染组件做低风险 memo 和稳定 props 治理，减少无关状态变更导致的重渲染。

修改文件：

- 修改 `src/components/EditorCanvas/Canvas.jsx`
- 修改 `src/components/EditorCanvas/Table.jsx`
- 修改相关 canvas 子组件
- 新增或修改测试

步骤：

- [ ] 写红灯或 instrumentation 测试，覆盖无关状态变化不导致关键 table 重渲染次数异常增长。
- [ ] 提取稳定回调和 props，使用 `React.memo` 或现有局部模式。
- [ ] 不改变拖拽、缩放、选择、撤销重做语义。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`。

完成标准：

- 主要画布交互无回归。
- 渲染优化有可解释的测试或 smoke 证据。

### 4.8 拖拽期间 pointer movement state 隔离

状态：未开始。

目标：拖拽期间减少 diagram model 全量更新，把高频 pointer movement 与最终 command commit 分离。

修改文件：

- 修改 `src/components/EditorCanvas/Canvas.jsx`
- 修改相关 pointer/drag helper
- 新增或修改拖拽 e2e

步骤：

- [ ] 写红灯 e2e 或单元测试，覆盖拖拽仍能移动对象且最终可撤销/重做。
- [ ] 将拖拽中间态限制在局部 state/ref，结束时再提交 diagram command。
- [ ] 确认锁定对象、缩放和平移不回归。
- [ ] 运行聚焦测试、`npm run e2e`、`npm run test`、`npm run build`。

完成标准：

- 拖拽语义保持一致。
- 高频 pointer move 不触发不必要的全局 diagram 更新。

### 4.9 500 表加载与搜索 smoke

状态：未开始。

目标：基于 performance fixtures 增加浏览器 smoke，覆盖 500 表打开、搜索、定位的最低可用性。

修改文件：

- 新增或修改 `src/test/e2e/performance.spec.js`
- 修改 Playwright helper 或 fixture loader

步骤：

- [ ] 写红灯 e2e，加载 500 表 fixture 后搜索目标表。
- [ ] 补必要的测试数据注入或本地 repository seed helper。
- [ ] 确认 smoke 不依赖网络或人工操作。
- [ ] 运行 `npm run e2e`、`npm run test`、`npm run build`。

完成标准：

- 500 表图能打开并搜索定位目标表。
- 该 smoke 可以作为后续性能优化防回归门禁。

## 5. Phase 4 退出门禁

Phase 4 所有切片完成后必须运行：

```bash
npm run lint
npm run test
npm run e2e
npm run accessibility
npm run build
npm run bundle:check
git diff --check
npm audit --audit-level=high
```

退出标准：

- bundle budget 脚本存在并被验证。
- Monaco、SQL parsers、image/PDF export libraries 和 tweet/social widgets 已按需或延迟加载。
- build 前后 chunk size 记录在验证矩阵。
- 100、500、1000 表 fixtures 存在。
- 500 表加载和搜索 smoke 通过。
- 本地无账号 editor 创建、保存、刷新恢复、导入导出和分享不可用提示无回归。

## 6. 下一轮默认任务

下一轮自动化默认执行 Phase 4.6 大图 performance fixtures。
