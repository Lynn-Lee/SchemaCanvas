# drawDB Phase 0 安全与工程底座实施计划

版本：2026-07-01

## 1. 阶段目标

Phase 0 的目标是先建立后续重构所需的安全说明、验证门禁、测试基础设施和高风险输入保护。这个阶段不改变 drawDB 的核心产品定位：默认仍然是无需账号、本地优先、浏览器内保存的 ERD 编辑器。

本阶段结束后，应满足：

- 本地无账号编辑、保存、刷新恢复仍可用。
- 仓库有清晰的安全报告入口、隐私边界和 dependency audit 策略。
- 有可重复执行的验证矩阵，后续每个阶段都能复用。
- 单元测试和浏览器 smoke 的基础设施可运行。
- 损坏 settings、超大导入文件、未配置分享后端等高风险场景不会导致白屏或误导用户。

## 2. 执行约束

- 每个任务只处理一个最小切片，提交信息使用 `docs:`、`test:`、`fix:` 或 `chore:` 前缀。
- 涉及代码行为时必须先补测试，再实现，再验证。
- 不做无关依赖升级；只有测试基础设施需要的依赖可以加入 `devDependencies`。
- 所有新增文档使用中文文件名和中文正文，专业术语可保留英文。
- 分享功能仍是用户显式触发的网络动作，不允许自动上传图表数据。
- Phase 0 未通过退出门禁前，不进入 Phase 1。

## 3. 任务拆分

### 0.1 安全文档与验证矩阵

状态：已完成，提交前验证已通过。`npm run build` 保留已知警告；`npm audit --audit-level=high` 通过但报告 2 个 moderate 漏洞，详情记录在 `docs/engineering/验证矩阵.md`。

目标：先把安全边界和验证门禁写清楚，为后续代码修改提供检查基线。

修改文件：

- 新增 `SECURITY.md`
- 新增 `docs/engineering/验证矩阵.md`
- 修改 `docs/superpowers/plans/2026-07-01-drawDB-Phase-0-安全与工程底座实施计划.md`

内容要求：

- `SECURITY.md` 覆盖 supported versions、漏洞报告方式、本地优先隐私模型、分享模式数据外发、dependency audit policy。
- `验证矩阵.md` 记录 `npm run lint`、`npm run build`、`npm audit --audit-level=high` 的当前状态。
- 说明 `npm run test` 和 `npm run e2e` 当前不存在，待 0.2 和 0.3 建立。

验证命令：

```bash
git diff --check
npm run lint
npm run build
npm audit --audit-level=high
```

完成标准：

- 文档存在且无占位内容。
- audit 高危门禁通过；中危问题可记录在验证矩阵中。
- 本地编辑器构建不回归。

### 0.2 Vitest 与 Testing Library 基线

状态：已完成，建立 `npm run test`、`npm run test:watch` 和 `npm run coverage` 脚本，新增 Vitest/jsdom setup、coverage provider、基础 diagram fixture 和测试工具。红灯记录为缺失 `src/test/utils/diagramFixtures.js` 导致聚焦测试失败，补齐实现后聚焦测试通过。

目标：建立可以测试纯函数、repository 和轻量 React 组件的单元测试基础设施。

修改文件：

- 修改 `package.json`
- 修改 `package-lock.json`
- 新增 `vitest.config.js`
- 新增 `src/test/setup.js`
- 新增 `src/test/utils/`
- 新增 `src/test/fixtures/diagrams/`

依赖建议：

- `vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`

脚本建议：

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "coverage": "vitest run --coverage"
}
```

验证命令：

```bash
npm run test
npm run lint
npm run build
```

完成标准：

- 至少有 1 个真实测试覆盖新建的测试环境。
- `npm run test` 可在本地稳定执行。
- 不引入与 Vite/React 当前版本冲突的依赖。

本轮验证：

```bash
npm run test -- src/test/utils/diagramFixture.test.js
npm run coverage -- src/test/utils/diagramFixture.test.js
```

结果：通过，1 个测试文件、1 个测试用例；coverage smoke 可生成报告，本地 `coverage/` 产物不提交。

### 0.3 Playwright 与浏览器 smoke 基线

状态：已完成，建立 `npm run e2e`、`playwright.config.js` 和 Chromium smoke。红灯记录为缺少 `playwright` 命令，补齐依赖和配置后首次运行因浏览器二进制缺失失败；执行 `npx playwright install chromium` 后，修正测试断言并通过 3 个 smoke 用例。

目标：建立 landing、editor、templates 基础浏览器 smoke，后续 UX 和 accessibility 任务可复用。

修改文件：

- 修改 `package.json`
- 修改 `package-lock.json`
- 新增 `playwright.config.js`
- 新增 `src/test/e2e/`

依赖建议：

- `@playwright/test`

脚本建议：

```json
{
  "e2e": "playwright test"
}
```

验证命令：

```bash
npm run e2e
npm run lint
npm run build
```

完成标准：

- smoke 至少覆盖 `/` 和 `/editor`。
- 测试中不依赖外部网络服务。
- 如果浏览器二进制缺失，记录安装命令和 blocker，不伪造通过。

本轮验证：

```bash
npm run e2e
```

结果：通过，Chromium 项目 3 个用例覆盖 `/`、`/templates` 和 `/editor`。运行时保留既有 React Router future flag、Semi UI defaultProps 和 `autofocus` console warning；这些不阻断 Phase 0.3，后续 UX/accessibility 任务再治理。

### 0.4 settingsRepository 与损坏配置恢复

状态：已完成，新增 `settingsRepository` 封装 settings 读取和写入，`SettingsContext` 不再直接解析 `localStorage.settings`。红灯记录为缺失 `src/persistence/settingsRepository.js` 导致聚焦测试失败，补齐实现后聚焦测试通过。

目标：修复 `localStorage.settings` 损坏导致初始化阶段 `JSON.parse` 抛错、页面白屏的问题。

修改文件：

- 新增 `src/persistence/settingsRepository.js`
- 修改 `src/context/SettingsContext.jsx`
- 新增或修改相关测试

设计要求：

- `readSettings(searchParams)` 返回 `{ settings, recovered }` 或等价结构。
- JSON 损坏时回退到默认设置，并清理或覆盖损坏值。
- URL theme 参数仍然优先生效，但必须经过 `queryConfig.theme.isValid` 校验。
- 写入失败时不阻断渲染，至少在 console 中给出可排查信息。

验证命令：

```bash
npm run test
npm run lint
npm run build
```

完成标准：

- 损坏 JSON 的测试先红后绿。
- 页面初始化不再因为 settings 损坏白屏。

本轮验证：

```bash
npm run test -- src/persistence/settingsRepository.test.js
```

结果：通过，4 个测试用例覆盖损坏 JSON 恢复、URL theme 优先级、无效 theme 忽略和写入失败不阻断渲染。

### 0.5 导入输入限制

目标：对 JSON、DDB、DBML、SQL 导入增加大小和复杂度限制，避免超大输入导致浏览器卡死或内存暴涨。

修改文件：

- 新增 `src/features/import/importLimits.js`
- 修改 `src/components/EditorHeader/Modal/ImportDiagram.jsx`
- 修改 `src/components/EditorHeader/Modal/ImportSource.jsx`
- 新增或修改相关测试

限制建议：

- 单个导入文件默认最大 5 MB。
- SQL/DBML 文本默认最大 2 MB。
- JSON/DDB 对象默认最大表数量、字段数量、关系数量和字符串长度。
- 错误信息需要告诉用户具体超出哪类限制。

验证命令：

```bash
npm run test
npm run lint
npm run build
```

完成标准：

- 超限文件不会进入 parser。
- 合法小文件仍可导入。
- 导入失败不清空当前图。

### 0.6 分享配置与外发确认

目标：明确分享功能的数据外发边界，未配置后端时给出可理解提示，首次上传前增加确认。

修改文件：

- 修改 `src/api/gists.js`
- 修改 `src/components/EditorHeader/Modal/Share.jsx`
- 新增或修改相关测试

设计要求：

- 缺少 `VITE_BACKEND_URL` 时不调用网络请求。
- UI 明确说明分享会把当前图表数据发送到配置的后端。
- 用户确认前不创建或更新分享链接。
- 已分享图表的更新流程需要保留，但仍要处理后端配置缺失。

验证命令：

```bash
npm run test
npm run lint
npm run build
```

完成标准：

- 未配置后端的分享弹窗不会泛化报错。
- 首次分享前有确认步骤。
- 本地模式不受影响。

### 0.7 Docker/nginx 安全 headers 与外部资源治理

目标：补齐部署层面的基础安全 header，并处理 `index.html` 外部 CDN icon 的完整性风险。

修改文件：

- 修改 `Dockerfile`
- 修改 `index.html`
- 可选新增 `nginx.conf`
- 可选新增本地 icon 资源

设计要求：

- 增加 `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy` 等低风险 header。
- 根据前端资源情况评估 `Content-Security-Policy`，不应贸然加入会破坏 Monaco、inline script 或 Vite 构建产物的严格 CSP。
- 外部 CDN icon 需要本地化，或补齐 SRI 和 `crossorigin`。

验证命令：

```bash
npm run lint
npm run build
docker build -t drawdb-phase0-smoke .
```

完成标准：

- Docker 可构建，或 Docker 不可用时记录真实错误。
- 静态构建产物可正常生成。

## 4. 阶段退出门禁

Phase 0 全部任务完成后必须运行：

```bash
npm run lint
npm run test
npm run build
npm audit --audit-level=high
```

如果已建立 e2e，还必须运行：

```bash
npm run e2e
```

退出标准：

- 上述命令通过，或阻塞项已经明确记录在 `docs/engineering/验证矩阵.md`。
- 本地无账号编辑仍可进入、创建表、保存并刷新恢复。
- 分享、导入、settings 的高风险失败路径有测试或浏览器 smoke 覆盖。
- `docs/engineering/验证矩阵.md` 已更新到最新状态。

## 5. 后续衔接

Phase 0 完成后，进入 Phase 1 前需要新增：

- `docs/superpowers/plans/2026-07-01-drawDB-Phase-1-Domain-Model-与本地持久化实施计划.md`

Phase 1 不应在 Phase 0 的测试基线和安全门禁稳定前启动。
