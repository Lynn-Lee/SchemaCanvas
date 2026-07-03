# drawDB Phase 6 全方位评估优化实施计划

版本：2026-07-03

> **给 agent 执行者的要求：** 具体执行本计划时，必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务推进。步骤使用 checkbox（`- [ ]`）语法跟踪。每个切片必须遵守 TDD：先写或更新失败测试确认红灯，再实现，再跑聚焦和全量验证。

## 1. 阶段背景

Phase 0–5 总控路线已完成。本阶段基于 2026-07-03 的全方位评估（架构审计 + 安全审计 + 产品边界复核），系统性修复评估发现的 Critical 和 High 问题，并按优先级推进 Medium 项治理。

本阶段不引入新产品能力，聚焦于**安全加固、架构债务清理、构建优化、国际化补齐和测试覆盖提升**。

## 2. 阶段目标

本阶段结束后，应满足：

- 所有 Critical 安全漏洞（ReDoS、正则注入、分享校验缺失、schema 绕过）已修复并有回归测试。
- API 层（email.js、gists.js）有完整错误处理和环境变量守卫。
- 部署安全 header（CSP、HSTS、X-Frame-Options）在 nginx 和 Vercel 两侧都已配置。
- IndexedDB 迁移路径完整，旧版用户升级不丢数据。
- 构建产物有代码拆分，DBML 解析器按需加载，路由级懒加载已落地。
- 4 个无翻译页面和 CloudDiagrams 缺失翻译键已补齐。
- validateDiagram 测试覆盖显著提升，覆盖率门禁已配置。
- 上帝组件 Workspace.jsx 和上帝 Context 有初步拆分或 memoize 缓解。

## 3. 当前代码入口

- `src/data/datatypes.js`：几何类型正则 ReDoS 风险点（行 1154、1163、1185、1197）。
- `src/utils/importSQL/postgres.js`：正则注入风险点（行 46、51）。
- `src/components/Workspace.jsx`：分享加载跳过校验（行 438-491）、上帝组件（882 行）。
- `src/components/EditorHeader/ControlPanel.jsx`：noteSchema `.valid` 缺失（行 895）。
- `src/api/email.js`：无环境变量守卫（行 4）。
- `src/api/gists.js`：零错误处理（行 23-103）。
- `src/data/db.js`：IndexedDB 版本迁移缺口（行 6）。
- `src/persistence/localDiagramRepository.js`：零错误处理（行 49-98）。
- `vite.config.js`：无代码拆分配置。
- `src/App.jsx`：无路由懒加载和错误边界（行 3-24）。
- `src/i18n/i18n.js`：53 语言全部静态加载（行 4-54）。
- `src/pages/LandingPage.jsx`、`NotFound.jsx`、`BugReport.jsx`、`Templates.jsx`：无翻译。
- `src/pages/CloudDiagrams.jsx`：17 个翻译键仅 1 个存在。
- `nginx.conf`、`vercel.json`：缺安全 header。
- `src/domain/validateDiagram.js`：542 行仅 3 个测试。
- `vitest.config.js`：无覆盖率配置。
- `docs/engineering/验证矩阵.md`：每个切片必须同步验证记录。

## 4. 执行约束

- 每轮自动化最多做一个最小切片，不跨任务。
- 涉及代码行为必须 TDD：先写或更新失败测试，确认红灯，再实现，再跑聚焦和全量验证。
- 安全修复切片不得引入新依赖，除非该依赖是修复的必要条件。
- 不得破坏本地无账号模式：任何修复后，未配置云端时 `/editor` 本地创建、保存、导入、导出、分享不可用提示必须完整可用。
- 不得自动上传图表数据：分享和云端上传必须保持用户显式触发。
- 每个切片完成后必须运行该切片的聚焦测试和全量门禁。
- Phase 6 不做新产品能力、不强制登录、不做实时协作。

## 5. 问题清单总览

### 5.1 Critical（P0，必须立即修复）

| 编号 | 问题 | 文件 | 行号 |
| --- | --- | --- | --- |
| C1 | ReDoS — 几何数据类型正则灾难性回溯 | `src/data/datatypes.js` | 1154, 1163, 1185, 1197 |
| C2 | 正则注入 — 用户输入直接拼入 `new RegExp()` | `src/utils/importSQL/postgres.js` | 46, 51 |
| C3 | 分享数据加载完全跳过安全校验 | `src/components/Workspace.jsx` | 438-491 |
| C4 | noteSchema 校验绕过 — 缺少 `.valid` | `src/components/EditorHeader/ControlPanel.jsx` | 895 |

### 5.2 High（P1，本阶段应修复）

| 编号 | 问题 | 文件 | 行号 |
| --- | --- | --- | --- |
| H1 | 上帝组件 Workspace.jsx（882 行，10 项职责） | `src/components/Workspace.jsx` | 全文件 |
| H2 | 上帝 Context DiagramContext（341 行，16 属性无 memo） | `src/context/DiagramContext.jsx` | 全文件 |
| H3 | 11 层 Provider 嵌套，10 个 Context value 无 useMemo | `src/pages/Editor.jsx` | 19-41 |
| H4 | 跨 Context 紧耦合，5 个 Context 互相 import hooks | `src/context/` 多个文件 | — |
| H5 | IndexedDB v67 缺 v1-v66 迁移函数 | `src/data/db.js` | 6 |
| H6 | localDiagramRepository 零错误处理，无事务 | `src/persistence/localDiagramRepository.js` | 49-98 |
| H7 | email.js 无 VITE_BACKEND_URL 守卫 | `src/api/email.js` | 4 |
| H8 | gists.js 零错误处理 | `src/api/gists.js` | 23-103 |
| H9 | 无代码拆分，DBML 解析器静态导入 | `vite.config.js`、`src/utils/importFrom/dbml.js` | — |
| H10 | 全部页面静态导入，无路由懒加载和错误边界 | `src/App.jsx` | 3-24 |
| H11 | 53 语言全部启动时静态加载 | `src/i18n/i18n.js` | 4-54 |
| H12 | 4 个页面完全无翻译（约 1000 行硬编码英文） | `src/pages/LandingPage.jsx` 等 4 文件 | — |
| H13 | CloudDiagrams 缺失 16 个翻译键 | `src/pages/CloudDiagrams.jsx` | — |
| H14 | nginx.conf 缺 CSP/HSTS/X-Frame-Options | `nginx.conf` | 8-14 |
| H15 | vercel.json 无任何安全 header | `vercel.json` | 1-5 |
| H16 | validateDiagram 测试覆盖率极低（542 行仅 3 个测试） | `src/domain/validateDiagram.test.js` | — |
| H17 | 无覆盖率门禁配置 | `vitest.config.js` | — |

### 5.3 Medium（P2，排入后续切片）

| 编号 | 问题 | 文件 |
| --- | --- | --- |
| M1 | `doubleRegex` 格式错误，`.` 未转义 | `src/data/datatypes.js:19` |
| M2 | `checkDefault` 无输入长度限制 | `src/domain/validateDiagram.js:37-40` |
| M3 | `diagramSchema` 无原型污染防护 | `src/domain/diagramSchema.js:18-37` |
| M4 | `validateDiagram` 不校验关系端点完整性 | `src/domain/validateDiagram.js:484-539` |
| M5 | 撤销栈无深度限制 | `src/domain/diagramHistory.js:14-31` |
| M6 | 3 处 FileReader 缺 `onerror` | `ImportDiagram.jsx:123`、`ImportSource.jsx:102`、`BugReport.jsx:41` |
| M7 | 4 处 console 日志泄露错误对象到生产 | `Workspace.jsx:229,488`、`Share.jsx:121`、`db.js:25` |
| M8 | lodash 全量引入（仅用 `_.isEqual` 一次） | `src/components/EditorHeader/SideSheet/Versions.jsx:14` |
| M9 | `diagramId` 索引非 unique | `src/data/db.js:8` |
| M10 | settings 无字段级验证和版本管理 | `src/persistence/settingsRepository.js:21-29` |
| M11 | CI 未运行 test/audit/bundle:check | `.github/workflows/build.yml` |
| M12 | 双重 CDN 图标库（bootstrap-icons + font-awesome） | `index.html:40-52` |
| M13 | react@18.2.0 非最新 18.x | `package.json` |
| M14 | `@vercel/analytics` 全局注入需确认隐私边界 | `src/main.jsx:13` |
| M15 | `oracle-sql-parser@0.1.0` 极不成熟 | `package.json` |
| M16 | 13 个 hook wrapper 缺 null guard | `src/hooks/` |
| M17 | `CollabContextProvider` 定义但未使用 | `src/context/CollabContext.jsx:9` |
| M18 | `CloudDiagrams` 路由无鉴权守卫 | `src/App.jsx:22` |

## 6. Phase 6 切片队列

### 6.1 ReDoS 正则修复（C1）

状态：待开始。

目标：修复 `datatypes.js` 中几何数据类型正则的灾难性回溯风险，并在 `checkDefault` 入口添加输入长度限制。

修改文件：

- 修改 `src/data/datatypes.js`
- 新增 `src/data/datatypes.test.js`（或扩展现有测试）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖 LINE、LSEG、PATH、POLYGON 正则在恶意输入（大量不完整括号对、超长字符串）下不产生指数回溯。测试策略采用组合断言而非纯耗时阈值，避免机器波动导致 flaky：(1) 输入长度上限断言——超过上限（如 1000 字符）的 `field.default` 直接返回 `false`，不进入正则；(2) 非回溯实现断言——对恶意输入（如 200 字符的不完整括号对）断言返回 `false` 且不挂起；(3) 合理耗时断言——对 1000 字符恶意输入断言 `checkDefault` 在宽松阈值内完成（如 200ms，留 4 倍机器波动余量），仅作为辅助断言，不作为唯一判据。
- [ ] 重写 LINE/LSEG 正则为非回溯模式，或改为逐字符扫描函数。例如将 `^(\(\d+,\d+\),)+\(\d+,\d+\)$` 改为先校验整体结构再逐段匹配。
- [ ] 重写 PATH/POLYGON 正则，消除嵌套量词 `*?` 与外层 `(\d+(\.\d+)?)` 的回溯叠加。
- [ ] 在 `checkDefault` 调用入口（`validateDiagram.js:37-40`）或各 `checkDefault` 函数内部，对 `field.default` 长度设置上限（如 1000 字符），超出直接返回 `false`。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 恶意几何类型默认值输入不再导致浏览器主线程挂起。
- 合法几何类型默认值仍能通过校验。
- 现有导入导出测试无回归。

### 6.2 正则注入修复（C2）

状态：待开始。

目标：修复 `postgres.js` 中用户输入直接拼入 `new RegExp()` 的注入风险。

修改文件：

- 修改 `src/utils/importSQL/postgres.js`
- 新增或扩展 `src/utils/importSQL/importSQL.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖包含正则特殊字符（如 `(a+)+b`、`.*`、`|`、`{}`）的 Postgres CREATE TYPE 名称不会导致异常或错误匹配。
- [ ] 新增 `escapeRegex(str)` 工具函数（可放在 `src/utils/importSQL/shared.js` 或 `src/utils/utils.js`）。
- [ ] 将 `postgres.js:46, 51` 的 `new RegExp(\`^(${t.name}|"${t.name}")$\`)` 改为使用 `escapeRegex(t.name)`。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 包含正则特殊字符的类型名称不再导致解析异常。
- 现有 Postgres SQL 导入测试无回归。

### 6.3 分享数据加载校验（C3）

状态：待开始。

目标：分享链接加载的图表数据必须经过与导入路径相同的安全校验链。

修改文件：

- 修改 `src/components/Workspace.jsx`
- 新增或扩展 `src/components/Workspace.test.jsx`（或针对 loadFromGist 的聚焦测试）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖 `loadFromGist` 加载超限数据（如 500+ 表、超长字符串）时拒绝加载并显示错误状态，不注入全局状态。
- [ ] 写红灯测试，覆盖 `loadFromGist` 加载非法字段默认值（触发 C1 已修复的正则）时拒绝加载。
- [ ] 在 `loadFromGist`（`Workspace.jsx:441`）中，`JSON.parse` 后先调用 `validateDiagramImportObject(parsedDiagram)`，超限则 `setSaveState(State.FAILED_TO_LOAD)` 并 return。
- [ ] 再调用 `validateDiagram(normalizeDiagram(parsedDiagram))`，存在 critical issue 时拒绝加载。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 恶意分享链接返回的超限或非法数据不会注入全局状态。
- 合法分享链接仍能正常加载。
- 加载失败时显示明确的错误状态，不白屏。

### 6.4 noteSchema 校验绕过修复（C4）

状态：待开始。

目标：修复粘贴处理中 noteSchema 校验始终通过的 bug。

修改文件：

- 修改 `src/components/EditorHeader/ControlPanel.jsx`
- 新增或扩展 `src/components/EditorHeader/ControlPanel.test.jsx`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖粘贴不符合 noteSchema 的 JSON 对象时不会被添加为 Note。
- [ ] 将 `ControlPanel.jsx:895` 的 `v.validate(obj, noteSchema)` 改为 `v.validate(obj, noteSchema).valid`。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 粘贴非法 JSON 对象不再被无条件添加为 Note。
- 粘贴合法 table/area/note JSON 仍能正常工作。

### 6.5 API 层错误处理与环境变量守卫（H7、H8）

状态：待开始。

目标：email.js 添加环境变量守卫；email.js 和 gists.js 所有 API 函数添加 try/catch 和响应校验。

修改文件：

- 修改 `src/api/email.js`
- 修改 `src/api/gists.js`
- 新增或扩展 `src/api/email.test.js`
- 扩展 `src/api/gists.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖 `VITE_BACKEND_URL` 未设置时 `email.send()` 不发起网络请求，返回结构化错误。
- [ ] 写红灯测试，覆盖 gists API 网络错误、非预期响应结构时返回结构化错误而非抛出。
- [ ] 在 `email.js` 添加 `assertBackendConfigured()` 守卫（参考 `gists.js:11-17`）。
- [ ] 在 `email.js` 和 `gists.js` 所有 API 函数中添加 try/catch，捕获 axios 错误并返回 `{ ok: false, reason, message }` 结构化结果。
- [ ] 在 `gists.js` 中对 `res.data.data.id` 等链式访问添加防御性检查。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 环境变量未设置时不发起网络请求。
- 网络错误和异常响应不抛出到调用方，返回结构化错误。
- 现有分享功能测试无回归。

### 6.6 部署安全 header（H14、H15）

状态：待开始。

目标：nginx.conf 和 vercel.json 添加 CSP、HSTS、X-Frame-Options 安全 header。

修改文件：

- 修改 `nginx.conf`
- 修改 `vercel.json`
- 修改 `src/deploy/dockerSecurity.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖 nginx.conf 包含 `Content-Security-Policy`、`Strict-Transport-Security`、`X-Frame-Options` header。
- [ ] 写红灯测试，覆盖 vercel.json 包含对应安全 headers 配置。
- [ ] 在 `nginx.conf` 添加 CSP（`default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://api.github-star-counter.workers.dev; frame-ancestors 'none';`）、HSTS（`max-age=63072000; includeSubDomains; preload`）、X-Frame-Options（`DENY`）。CSP `script-src` 必须包含 `'unsafe-eval'`，因为 Semi UI 的 lottie-web 动画依赖 `eval()`；此约束需在验证矩阵记录，长期目标是替换 lottie-web 以收紧 CSP。
- [ ] 在 `vercel.json` 添加 `headers` 配置，与 nginx 对齐（同样包含 `'unsafe-eval'`）。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。如条件允许运行 `docker build` 验证。

完成标准：

- nginx 和 Vercel 两侧都有完整安全 header。
- Docker 安全测试通过。
- 现有 SRI 测试无回归。

### 6.7 IndexedDB 迁移路径补齐（H5）

状态：待开始。

目标：为 Dexie v67 补充从早期版本到当前版本的迁移路径，确保旧版用户升级不丢数据。

修改文件：

- 修改 `src/data/db.js`
- 新增 `src/data/db.test.js`（或扩展）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 调研：确认 drawDB 历史发布版本中 IndexedDB schema 版本号范围（检查 git 历史中 `db.js` 的 `db.version()` 调用记录）。
- [ ] 写红灯测试，覆盖从旧版 schema（如 v1、v10、v50）升级到 v67 时数据不丢失。
- [ ] 在 `db.js` 中为缺失的版本区间添加 `.upgrade()` 迁移函数，或确认 Dexie 的默认行为（无 upgrade 函数时仅更新 schema 不迁移数据）对当前数据结构安全。
- [ ] 如果确认无历史用户基数（如本项目重构后首次发布），则在 `db.js` 中添加注释说明版本跳跃的安全性依据，并在验证矩阵记录。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 旧版 IndexedDB 升级到 v67 不丢数据或有明确文档说明安全性依据。
- 种子数据初始化错误不再静默吞掉（修复 M7 中的 `db.js:25` console.log）。

### 6.8 localDiagramRepository 错误处理与事务（H6）

状态：待开始。

目标：为 localDiagramRepository 所有 CRUD 方法添加 try/catch，`saveDiagram` 的 read-then-write 添加事务边界。

修改文件：

- 修改 `src/persistence/localDiagramRepository.js`
- 扩展 `src/persistence/localDiagramRepository.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖 Dexie 操作失败时 repository 返回结构化错误而非抛出。
- [ ] 写红灯测试，覆盖 `saveDiagram` 写入失败时不产生半写入状态。
- [ ] 为所有 6 个 CRUD 方法添加 try/catch，返回 `{ ok: false, reason, message }` 结构化结果。
- [ ] 将 `saveDiagram` 的 read-then-write 包裹在 `db.transaction('rw', db.diagrams, async () => {...})` 中。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- Dexie 错误不直接抛出到调用方。
- `saveDiagram` 写入失败无半写入状态。

### 6.9 DBML 解析器懒加载（H9）

状态：待开始。

目标：将 `@dbml/core` 改为动态 import 按需加载，与 SQL 解析器懒加载模式对齐。

修改文件：

- 修改 `src/utils/importFrom/dbml.js`
- 新增 `src/build/dbmlLazyBoundary.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖入口 bundle 不静态导入 `@dbml/core`（参考 `sqlParserLazyBoundary.test.js` 模式）。
- [ ] 将 `dbml.js` 顶层的 `import { Parser } from "@dbml/core"` 改为 `const { Parser } = await import("@dbml/core")`。
- [ ] 确保 DBML 导入函数变为 async，调用方适配。
- [ ] 运行聚焦测试、`npm run test`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- `@dbml/core` 不在入口 bundle 中。
- DBML 导入功能仍正常工作。
- 最大 JS chunk 下降。

### 6.10 路由懒加载与错误边界（H10）

状态：待开始。

目标：6 个页面改为 `React.lazy` + `<Suspense>` 懒加载，添加路由级错误边界。

修改文件：

- 修改 `src/App.jsx`
- 新增 `src/components/ErrorBoundary.jsx`
- 新增 `src/components/ErrorBoundary.test.jsx`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖页面级渲染错误不导致白屏，显示错误边界 fallback。
- [ ] 写红灯测试，覆盖 Editor 页面独立 chunk（可通过 bundle 分析或 import 路径断言）。
- [ ] 新增 `ErrorBoundary` 组件，捕获渲染错误显示 fallback UI。
- [ ] 将 `App.jsx` 中 6 个页面改为 `React.lazy(() => import(...))`，用 `<Suspense fallback={...}>` 包裹。
- [ ] 用 `<ErrorBoundary>` 包裹 `<Routes>` 或每个路由元素。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 页面渲染错误不白屏。
- Editor 页面拆为独立 chunk。
- 现有 e2e smoke 无回归。

### 6.11 i18n 按需加载（H11）

状态：待开始。

目标：将 53 个语言文件改为按需加载，仅加载用户当前语言。

修改文件：

- 修改 `src/i18n/i18n.js`
- 新增或扩展 `src/i18n/i18n.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖入口 bundle 不静态导入所有语言文件。
- [ ] 将 `i18n.js` 中 51 个静态 `import` 改为 i18next 的 `addResources` 或 backend 按需加载机制。
- [ ] 确保语言切换时动态加载对应语言包，加载失败回退到英文。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 入口 bundle 不包含所有语言翻译。
- 语言切换功能正常。
- 最大 JS chunk 下降。

### 6.12 国际化补齐（H12、H13）

状态：待开始。

目标：4 个无翻译页面接入 i18next；CloudDiagrams 缺失的 16 个翻译键补齐。翻译键验收口径：`en.js` 和 `zh.js` 必须包含全部新增键的完整翻译；其他语言文件不强制全量补齐，缺失键由 i18next 默认回退到 `en.js`，不显示原始键名即可。

修改文件：

- 修改 `src/pages/LandingPage.jsx`
- 修改 `src/pages/NotFound.jsx`
- 修改 `src/pages/BugReport.jsx`
- 修改 `src/pages/Templates.jsx`
- 修改 `src/pages/CloudDiagrams.jsx`
- 修改 `src/i18n/locales/en.js`
- 修改 `src/i18n/locales/zh.js`（及其他主要语言）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖 LandingPage 渲染时使用 `useTranslation` 而非硬编码字符串。
- [ ] 为 LandingPage、NotFound、BugReport、Templates 中所有英文硬编码字符串提取翻译键。
- [ ] 在 `en.js` 和 `zh.js` 中添加对应翻译键。
- [ ] 在 CloudDiagrams 使用的 17 个 `cloud_diagrams_*` 键中，补齐缺失的 16 个到 `en.js` 和 `zh.js`。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run accessibility`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 4 个页面非英语用户可访问（`en.js` 和 `zh.js` 有完整翻译，其他语言回退到 `en.js`）。
- CloudDiagrams 不再显示原始键名（`en.js` 和 `zh.js` 包含全部 17 个 `cloud_diagrams_*` 键）。
- 现有 e2e 和 axe smoke 无回归。

### 6.13 validateDiagram 测试覆盖提升（H16）

状态：待开始。

目标：为 `validateDiagram.js`（542 行）补充关键路径测试，覆盖关系端点、循环检测、类型校验、枚举校验、索引/约束检查、默认值检查。

修改文件：

- 修改 `src/domain/validateDiagram.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 补充测试：关系端点指向不存在的表/字段时报告 critical issue。
- [ ] 补充测试：循环依赖检测覆盖 2 表循环和 3 表循环。
- [ ] 补充测试：类型定义字段名重复、枚举值重复。
- [ ] 补充测试：索引字段不存在、唯一约束字段不存在。
- [ ] 补充测试：默认值校验覆盖 INT、VARCHAR、BOOLEAN、DATE 等主要类型。
- [ ] 补充测试：空表名、空字段名、重复表名（扩展现有 3 个测试）。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- validateDiagram 测试用例数从 3 个提升到 15+ 个。
- 关键校验路径均有测试覆盖。

### 6.14 覆盖率门禁配置（H17）

状态：待开始。

目标：在 `vitest.config.js` 中配置 coverage，设置最低覆盖率门禁。

修改文件：

- 修改 `vitest.config.js`
- 修改 `package.json`（如需调整 coverage 脚本）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 在 `vitest.config.js` 中添加 `coverage` 配置：provider 'v8'，reporter ['text', 'html']，include `src/**/*.{js,jsx}`，exclude 测试文件和 `src/test/`。
- [ ] 设置初始门禁：lines 40%、functions 40%、branches 30%、statements 40%（基于当前覆盖现状，后续逐步提升）。
- [ ] 运行 `npm run coverage` 确认门禁可通过。
- [ ] 运行 `npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- `npm run coverage` 可生成覆盖率报告。
- 覆盖率门禁配置生效，当前代码可通过。

### 6.15 Context value memoize 缓解（H3）

状态：待开始。

目标：为 10 个无 `useMemo` 的 Context Provider 添加 `useMemo` 包裹 value，缓解级联重渲染。不含 `CanvasContext`（已有 `useMemo`）、`CollabContext`（已有 `useMemo` 但未接入）、`DiagramContext`（上帝对象，由 H2 单独处理）和 `ExtensionsContext`（无 Provider）。

修改文件：

- 修改 `src/context/UndoRedoContext.jsx`
- 修改 `src/context/SelectContext.jsx`
- 修改 `src/context/TransformContext.jsx`
- 修改 `src/context/SaveStateContext.jsx`
- 修改 `src/context/LayoutContext.jsx`
- 修改 `src/context/SettingsContext.jsx`
- 修改 `src/context/AreasContext.jsx`
- 修改 `src/context/NotesContext.jsx`
- 修改 `src/context/TypesContext.jsx`
- 修改 `src/context/EnumsContext.jsx`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [ ] 写红灯测试，覆盖父层无关状态变化时不触发子 Context 消费者重渲染（可基于 render count instrumentation，参考 `CanvasRenderLayer.test.jsx` 模式）。
- [ ] 为 10 个 Context 的 `value={{...}}` 添加 `useMemo(() => ({...}), [依赖项])`。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- Context value 引用稳定，无关状态变化不触发消费者重渲染。
- 现有功能和测试无回归。

### 6.16 Medium 项批量治理（M1–M18）

状态：待开始。

目标：按优先级批量处理 Medium 项，每个项可独立成一个最小切片或合并为小批次。

建议子切片：

- [ ] M1+M2：修复 `doubleRegex` 格式错误，`checkDefault` 添加长度限制（与 6.1 合并或紧随其后）。
- [ ] M3：`diagramSchema` 添加原型污染防护（`Object.create(null)` 或 `hasOwnProperty` 检查）。
- [ ] M4：`validateDiagram` 添加关系端点完整性校验（与 6.13 合并）。
- [ ] M5：`diagramHistory` 添加撤销栈深度限制（如 100 步）。
- [ ] M6：3 处 FileReader 添加 `onerror` 回调。
- [ ] M7：4 处 console 日志改为 `import.meta.env.DEV` 条件输出。
- [ ] M8：lodash 改为 `import isEqual from "lodash/isEqual"`。
- [ ] M9：`diagramId` 索引改为 unique。
- [ ] M10：settings 添加字段级验证和 schema 版本号。
- [ ] M11：CI 添加 `npm run test`、`npm audit --audit-level=high`、`npm run bundle:check`。
- [ ] M12：评估移除未使用的 CDN 图标库。
- [ ] M13：react 升级到 18.3.1。
- [ ] M14：`@vercel/analytics` 在 SECURITY.md 补充隐私边界说明。
- [ ] M15：评估 oracle-sql-parser 是否可移除或替换。
- [ ] M16：13 个 hook wrapper 添加 null guard。
- [ ] M17：评估 CollabContext 是否移除或接入。
- [ ] M18：CloudDiagrams 路由添加鉴权守卫（云端能力启用时）。

每个子切片完成后运行聚焦测试和全量门禁。

## 7. Phase 6 退出门禁

状态：待开始。

Phase 6 所有切片完成后必须运行：

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

- [ ] 所有 Critical 安全漏洞（C1–C4）已修复并有回归测试。
- [ ] API 层有完整错误处理和环境变量守卫。
- [ ] nginx 和 Vercel 两侧都有完整安全 header。
- [ ] IndexedDB 迁移路径完整或有明确安全性文档。
- [ ] DBML 解析器按需加载，路由级懒加载已落地。
- [ ] 4 个无翻译页面和 CloudDiagrams 翻译键已补齐。
- [ ] validateDiagram 测试覆盖显著提升，覆盖率门禁已配置。
- [ ] Context value memoize 缓解已落地。
- [ ] 本地无账号模式完整可用。
- [ ] 不自动上传图表数据。
- [ ] 无新增 high/critical 依赖漏洞。

## 8. 风险与注意事项

- **CSP 与 lottie-web**：Semi UI 的 lottie-web 依赖 `eval()`，CSP 的 `script-src` 需要 `'unsafe-eval'`。这会削弱 CSP 防护。长期方案是评估替换 Semi UI 动画组件或 lottie-web，短期在 CSP 中显式记录此约束。
- **IndexedDB 迁移**：如果确认本项目重构后首次发布无历史用户基数，则 v1-v66 迁移可简化为文档说明，但仍需在 `db.js` 注释和验证矩阵中记录依据。
- **i18n 按需加载**：语言文件改为动态加载后，首次切换语言可能有短暂延迟，需提供 loading 状态。
- **Context memoize**：添加 `useMemo` 时必须仔细识别依赖项，遗漏依赖项会导致状态不更新，多余依赖项会削弱优化效果。
- **Workspace.jsx 拆分**：本阶段仅做 memoize 缓解，完整拆分留待后续 Phase（如 Phase 7 架构重构），因为拆分涉及大量测试调整。

## 9. 下一轮默认任务

Phase 6 完成后，下一轮应评估：

- 是否需要 Phase 7 架构重构（Workspace.jsx 和 DiagramContext 完整拆分、跨 Context 解耦）。
- 是否需要产品 roadmap 调整（新数据库支持、模板市场、协作能力等）。
- 是否需要依赖现代化（Dexie 4.x、React 19、Semi UI 替代评估）。