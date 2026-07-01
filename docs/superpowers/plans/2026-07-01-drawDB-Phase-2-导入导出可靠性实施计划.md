# drawDB Phase 2 导入导出可靠性实施计划

版本：2026-07-01

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 1. 阶段目标

Phase 2 的目标是把 drawDB 的 SQL、DBML、JSON、DDB 和文档导入导出能力从“能跑”推进到 fixture-backed、可预览、可回归。所有导入输入仍按非可信输入处理，导入失败不得清空当前图，导出结果必须稳定到可以做 golden tests。

本阶段结束后，应满足：

- MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle、DBML、JSON、DDB 有明确 fixtures 和支持范围说明。
- JSON/DDB/DBML/SQL 导入先经过 service，返回 `{ ok, diagram, preview, issues }`，React 弹窗只负责展示和确认。
- 导入弹窗能展示表数量、关系数量、类型、枚举和 warning 预览。
- 导入支持覆盖当前图、合并当前图、作为新图导入三种模式。
- SQL/DBML 导出有 golden tests，输出稳定可回归。
- 全量本地备份导出不复用旧 `JSZip` 实例，文件名安全化，日期使用 ISO 格式。

## 2. 当前代码入口

- `src/components/EditorHeader/Modal/ImportDiagram.jsx`：当前负责 JSON、DDB、DBML 文件读取、schema 校验、引用完整性检查和直接设置导入数据。
- `src/components/EditorHeader/Modal/ImportSource.jsx`：当前负责 SQL 文本和文件读取，并把输入写入 `importData.src`。
- `src/components/EditorHeader/Modal/Modal.jsx`：当前集中处理导入弹窗确认、数据库选择和导入后状态写入。
- `src/features/import/importLimits.js`：Phase 0 已建立文件大小、文本长度、对象数量和字符串长度限制。
- `src/utils/importSQL/*`：当前按数据库 dialect 把 parser AST 转为 drawDB diagram。
- `src/utils/importFrom/dbml.js`：当前 DBML 导入入口。
- `src/utils/exportSQL/*`：当前 SQL 导出入口。
- `src/utils/exportAs/dbml.js`、`src/utils/exportAs/documentation.js`、`src/utils/exportAs/mermaid.js`：当前 DBML、Markdown、Mermaid 导出入口。
- `src/utils/exportSavedData.js`：当前全量本地备份导出入口，存在 `JSZip` 模块级复用和日期格式问题。
- `src/domain/normalizeDiagram.js`、`src/domain/validateDiagram.js`：Phase 1 已完成，可作为 import service 的统一归一化和 issue 输出基础。

## 3. 执行约束

- 每轮自动化最多做一个最小切片，不跨 Phase。
- 涉及代码行为必须 TDD：先写或更新失败测试，确认红灯，再实现，再跑聚焦和全量验证。
- 不做 parser 依赖升级，除非某个任务明确证明现有 parser 无法覆盖阶段目标。
- 不追求完整 SQL 方言覆盖；不支持的语法必须以 warning 或 error issue 明确返回。
- 导入 service 不得直接调用 React state setter，不得依赖 DOM。
- 导入失败不得覆盖当前 diagram；覆盖、合并、新建必须由用户确认模式后才发生。
- 所有新增文档使用中文文件名和中文正文，专业术语可保留英文。
- Phase 2 未通过退出门禁前，不进入 Phase 3 或 Phase 5。

## 4. Phase 2 切片队列

### 2.1 支持范围文档与 fixture 目录

状态：已完成。

目标：先建立导入导出支持范围文档和 fixture 目录结构，不改变运行时代码。

修改文件：

- 新增 `docs/engineering/导入导出支持范围.md`
- 新增 `src/test/fixtures/import-export/README.md`
- 新增 `src/test/fixtures/sql/README.md`
- 新增 `src/test/fixtures/dbml/README.md`
- 新增 `src/test/fixtures/diagrams/README.md`
- 修改本实施计划状态记录

步骤：

- [x] 记录每个 dialect 的支持矩阵：table、primary key、composite foreign key、index、unique、default、check、comment、enum、unsupported syntax。
- [x] 定义 fixtures 命名规则：`<dialect>-<capability>.sql`、`<dialect>-<capability>.expected.json`、`<format>-<capability>.golden.*`。
- [x] 明确 warning/error issue 口径，导入失败和部分支持的区别。
- [x] 运行 `git diff --check`、`npm run lint`、`npm run test`。

完成标准：

- 文档不是占位内容，能直接指导后续 fixture 和 service 任务。
- 不新增源码行为，验证命令通过。

### 2.2 基础 fixtures 与 importSQL smoke tests

状态：已完成。

目标：为 MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle 建立第一批小型 SQL fixtures，并用当前 `importSQL` 入口形成回归测试。

修改文件：

- 新增 `src/test/fixtures/sql/mysql-basic.sql`
- 新增 `src/test/fixtures/sql/postgres-basic.sql`
- 新增 `src/test/fixtures/sql/sqlite-basic.sql`
- 新增 `src/test/fixtures/sql/mariadb-basic.sql`
- 新增 `src/test/fixtures/sql/mssql-basic.sql`
- 新增 `src/test/fixtures/sql/oracle-basic.sql`
- 新增 `src/features/import/importSqlService.test.js` 或 `src/utils/importSQL/importSQL.test.js`

步骤：

- [x] 写红灯测试，覆盖每个 dialect 至少能导入两张表、一个主键和一个关系。
- [x] 运行聚焦测试，确认当前缺少 fixtures 或 service 入口导致失败。
- [x] 补齐 fixtures 和最小测试 helper；暂不改变 UI。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`。

完成标准：

- SQL fixtures 可被测试稳定读取。
- 当前支持能力有第一层回归保护。

完成记录：

- 已新增 MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle 的 `basic` SQL fixtures。
- 已新增 `src/utils/importSQL/importSQL.test.js`，覆盖 6 个 dialect 的两表、主键和关系导入 smoke。
- MSSQL 当前 parser 对 foreign key SQL 语法支持有限，测试 helper 只在 fixture 层把 `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` 映射为现有 `fromMSSQL` 支持的 alter AST；Phase 2.4 SQL import service 需要把该边界转为用户可见 warning/error 或 parser 兼容层。

### 2.3 JSON/DDB/DBML import service

状态：已完成。

目标：把 JSON、DDB、DBML 导入解析从 `ImportDiagram.jsx` 抽成纯 service，并返回统一结果。

修改文件：

- 新增 `src/features/import/importDiagramService.js`
- 新增 `src/features/import/importDiagramService.test.js`
- 修改 `src/components/EditorHeader/Modal/ImportDiagram.jsx`

导出接口建议：

```js
export function importDiagramFileContent({
  content,
  fileName,
  fileType,
  importFrom,
  currentDatabase,
}) {
  return { ok, diagram, preview, issues };
}
```

步骤：

- [x] 写红灯测试，覆盖合法 JSON、合法 DDB、合法 DBML、错误 JSON、数据库不匹配、关系引用缺失。
- [x] 确认 service 缺失导致聚焦测试失败。
- [x] 实现 service，内部复用 `validateImportText`、`validateDiagramImportObject`、`normalizeDiagram` 和 `validateDiagram`。
- [x] 让 `ImportDiagram.jsx` 只负责读取文件、调用 service、展示结果和设置 `importData`。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run e2e`。

完成标准：

- 导入失败返回 `{ ok: false, issues }`，不直接覆盖当前图。
- 弹窗行为与 Phase 0 导入限制兼容。

完成记录：

- 已新增 `src/features/import/importDiagramService.js`，统一 JSON、DDB、DBML 导入结果为 `{ ok, diagram, preview, issues }`。
- 已新增 `src/features/import/importDiagramService.test.js`，覆盖合法 JSON、合法 DDB、合法 DBML、错误 JSON、数据库不匹配和关系引用缺失。
- `ImportDiagram.jsx` 已改为只读文件并调用 service；确认导入时兼容 normalized diagram 的 `areas` 和 `name` 字段。

### 2.4 SQL import service 与 preview

状态：未开始。

目标：把 SQL 文本导入封装为 service，返回 diagram preview 和结构化 issues。

修改文件：

- 新增 `src/features/import/importSqlService.js`
- 新增 `src/features/import/importSqlService.test.js`
- 修改 `src/components/EditorHeader/Modal/ImportSource.jsx`
- 修改 `src/components/EditorHeader/Modal/Modal.jsx`

导出接口建议：

```js
export function importSqlText({ sql, dialect, diagramDatabase }) {
  return { ok, diagram, preview, issues };
}
```

步骤：

- [ ] 写红灯测试，覆盖合法 SQL、空 SQL、超长 SQL、parser error、不支持语法 warning。
- [ ] 实现 service，内部调用现有 parser 和 `importSQL`，再 normalize 和 validate。
- [ ] 在弹窗中展示表数量、关系数量、warning 数量。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run e2e`。

完成标准：

- SQL 导入逻辑不再散落在 React state 中。
- 用户确认前只预览，不改当前 diagram。

### 2.5 导入模式：覆盖、合并、作为新图

状态：未开始。

目标：导入确认时支持三种明确模式，避免当前单一 overwrite checkbox 语义不清。

修改文件：

- 新增 `src/features/import/applyImportMode.js`
- 新增 `src/features/import/applyImportMode.test.js`
- 修改 `src/components/EditorHeader/Modal/ImportSource.jsx`
- 修改 `src/components/EditorHeader/Modal/ImportDiagram.jsx`
- 修改 `src/components/EditorHeader/Modal/Modal.jsx`

步骤：

- [ ] 写红灯测试，覆盖覆盖当前图、合并当前图、作为新图导入三种模式。
- [ ] 实现纯函数 `applyImportMode(currentDiagram, importedDiagram, mode)`，合并时必须处理 id 冲突。
- [ ] UI 从 checkbox 改为 radio/segmented control，文案明确说明每种模式。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 导入失败或取消不改变当前图。
- 三种模式有测试覆盖，并通过浏览器 smoke。

### 2.6 SQL/DBML 导出 service 与 golden tests

状态：未开始。

目标：把 SQL、DBML 导出收敛到 service，建立稳定 golden tests。

修改文件：

- 新增 `src/features/export/exportDiagramService.js`
- 新增 `src/features/export/exportDiagramService.test.js`
- 新增 `src/test/fixtures/export/`
- 修改 `src/utils/exportSQL/*` 或最小包装现有导出入口
- 修改 `src/utils/exportAs/dbml.js`

步骤：

- [ ] 写红灯测试，覆盖 MySQL、PostgreSQL、SQLite、DBML 的稳定输出。
- [ ] 建立 golden fixture，统一换行和尾随换行策略。
- [ ] 实现 service，导出前 normalize diagram。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`。

完成标准：

- SQL/DBML 输出在没有行为变化时不会漂移。
- golden fixture 可读，失败 diff 能定位具体变更。

### 2.7 Markdown、Mermaid、image、PDF 导出入口梳理

状态：未开始。

目标：把非 SQL/DBML 导出入口纳入统一 service facade，先不重写底层生成逻辑。

修改文件：

- 修改 `src/features/export/exportDiagramService.js`
- 修改或新增对应测试
- 必要时修改 `src/components/EditorHeader/Modal/Modal.jsx`

步骤：

- [ ] 写测试覆盖 Markdown 和 Mermaid 导出返回稳定字符串。
- [ ] 对 image/PDF 仅做 facade 参数校验和错误传播测试，不在 jsdom 中生成真实文件。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`。

完成标准：

- 后续 UI 只依赖 export service facade。
- 浏览器专属导出能力在测试中有清晰边界。

### 2.8 全量本地备份导出修复

状态：未开始。

目标：修复 `exportSavedData` 复用模块级 `JSZip`、文件名不安全和日期 `getMonth/getDay` 误导问题。

修改文件：

- 修改 `src/utils/exportSavedData.js`
- 新增 `src/utils/exportSavedData.test.js`

步骤：

- [ ] 写红灯测试，覆盖连续两次导出不会复用前一次 zip 内容、文件名安全化、导出 zip 文件名使用 ISO 日期。
- [ ] 实现每次调用创建新的 `JSZip` 实例。
- [ ] 对 diagram/template 名称做文件名安全化。
- [ ] 日期使用 `YYYY-MM-DDTHH-mm-ss` 或等价 ISO 安全格式。
- [ ] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`。

完成标准：

- 全量备份可重复执行且内容不串包。
- 文件名在常见文件系统中安全。

## 5. Phase 2 退出门禁

Phase 2 所有切片完成后必须运行：

```bash
npm run lint
npm run test
npm run e2e
npm run build
git diff --check
npm audit --audit-level=high
```

退出标准：

- fixture matrix 覆盖 MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle、DBML、JSON、DDB。
- 导入失败不清空当前图。
- 复合外键可导入、预览、确认和导出。
- 导入 preview 至少展示表数量、关系数量、类型、枚举和 warning。
- 覆盖、合并、新建三种导入模式有测试保护。
- SQL/DBML 导出有 golden tests。
- 全量本地备份 zip 可重复导出，文件名安全且日期准确。
- 本地无账号 editor 创建、保存、刷新恢复无回归。

## 6. 下一轮默认任务

下一轮自动化默认执行 Phase 2.4：抽取 SQL import service 与 preview，返回统一 `{ ok, diagram, preview, issues }`，并把 parser error、不支持语法和导入 preview 从 React state 中分离出来。
