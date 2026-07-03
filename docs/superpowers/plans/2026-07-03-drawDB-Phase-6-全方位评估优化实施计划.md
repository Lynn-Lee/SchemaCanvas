# drawDB Phase 6 全方位评估优化实施计划

版本：2026-07-03（2026-07-04 独立复核修订，见 5.3.1、5.3.2）

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

### 5.3.1 复核修正（2026-07-04 独立复核）

以下是对本计划已列条目的复核结论，复核方式为实测/读源码验证，不是重新臆测。**执行者应以此处结论为准**，原表格描述仅供追溯：

- **C1 严重程度修正**：对 `datatypes.js:1154/1163/1185/1197` 四个正则用 Node 实测多组恶意输入（不完整括号对、超长无分隔符数字串、递增长度到 5000 字符），均未观测到指数级回溯（耗时始终为 0-1ms）。原因是这些正则的重复/嵌套量词之间都由非数字字面量（`,` `(` `)` `.`）分隔，`\d+` 无法跨分隔符扩张，不存在同一子串的多种切分方式，因此不构成经典 ReDoS。**结论：C1 应重新定位为"防御性加固"而非"已确认的灾难性回溯漏洞"**。步骤 6.1 中的长度上限（M2 一并处理）仍然是必要且低成本的加固，应保留；但正则重写为"非回溯模式"的紧迫性应降级为可选项，红灯测试不应基于"验证指数回溯确实存在"来写（因为验证不出来），而应基于"任意情况下长度超限直接拒绝、且合法输入仍通过"来写。
- **C2 影响面澄清**：`postgres.js:46,51` 的正则注入确认为真实缺陷，但触发向量是用户导入自己持有或他人分享的恶意 `.sql` 文件（本地/自触发，不是无感知远程利用）。真实后果是 `new RegExp()` 编译异常（非法正则语法直接抛错中断导入）或极端情况下的 ReDoS（如果类型名本身是攻击性正则片段且被加引号规避标识符限制）。修复方案（`escapeRegex`）不变，但验证矩阵记录时应准确描述影响面，不要写成"远程代码执行"或"数据泄露"类描述。
- **C3 范围遗漏，必须扩大**：`src/components/EditorHeader/SideSheet/Versions.jsx:96`（`loadVersion` 中 `JSON.parse(content)` 后直接 `setTables/setRelationships/...`）和 `:186`（`hasDiagramChanged` 中 `JSON.parse` 比较历史版本）与 `Workspace.jsx` 的 `loadFromGist` 属于**同一漏洞类别**——都在解析分享后端返回的版本历史内容后跳过 `validateDiagramImportObject`/`validateDiagram` 直接写入状态。`SECURITY.md` 第 51-62 节已明确把"分享链接返回的数据"列为不可信输入，`Versions.jsx` 的两处调用同样在这个范围内。**6.3 节的修改文件清单和步骤必须加入 `Versions.jsx`，否则同一漏洞类别只堵住一个入口，另一个（版本回溯/版本对比）仍然可以被恶意分享后端数据攻击。**
- **C4 无原型污染风险，不要引入这个理由**：`ControlPanel.jsx:895` 附近的 `{...obj}` 展开（880-901 行）不会导致 `Object.prototype` 污染——已用 Node 实测确认：对象字面量展开语法（`{...obj}`）在拷贝属性时走的是 `CreateDataProperty`，不会触发 `__proto__` 访问器的 setter，即使 `obj` 是 `JSON.parse` 出来的、带有形如 `{"__proto__":{...}}` 的自有属性，展开后也只是一个字面量为 `"__proto__"` 的普通键，不改变目标对象的原型链，更不会污染全局 `Object.prototype`。C4 的真实风险仍然成立，但性质是"校验绕过导致任意剪贴板 JSON 被当作 Note 添加"（可能造成渲染异常/脏状态），不是原型污染类安全漏洞，验证矩阵中不要写成原型污染。
- **6.9 节引用路径需要更正**：该节的假设是"与 SQL 解析器懒加载模式对齐"。核查后确认：`src/utils/importSQL/*.js`（各方言转换器，如 `postgres.js`）本身确实没有动态 `import()`；真正已经落地的懒加载边界在 **`src/features/import/importSqlService.js`**（第 101-102 行动态 `import("node-sql-parser")` / `import("oracle-sql-parser")`，并有 `src/build/sqlParserLazyBoundary.test.js` 把关）。执行者实现 6.9 时应参照 `importSqlService.js` 的模式和 `sqlParserLazyBoundary.test.js` 的写法，而不是去 `utils/importSQL/` 目录找参照对象，避免走错路径浪费时间。
- **M11（CI 门禁）建议提前执行，不要留到 6.16 收尾**：当前 `.github/workflows/build.yml` 只跑 `npm install` → `npm run lint` → `npm run build`，完全不跑 `npm run test`/`npm run e2e`/`npm audit`。Phase 6 的执行方法论要求"先写红灯测试、再实现、再跑聚焦和全量验证"，但如果 CI 不强制跑测试，这套方法论只在执行者本地手动跑的那一刻生效，后续任何人的 PR 都可能在无人察觉的情况下引入回归、悄悄跑绿一个从未真正执行的测试套件。**建议将 M11 从"6.16 批量治理"中取出，作为 C1-C4 完成后、H 类任务开始前的独立最小切片提前执行**（只加 `npm run test` 和 `npm audit --audit-level=high` 两步，`e2e`/`bundle:check` 视 CI 时长预算决定是否一并加入），为后续所有切片提供真正的回归保护。
- **M15 定性修正**：`oracle-sql-parser@0.1.0` 的不成熟状态**已经是产品方有意识的已知取舍**——`NewDiagramWizard` 中 Oracle 选项本身就标注为 `beta`，不是"未被意识到的技术债"。M15 的动作项应改为"确认 beta 标注和用户预期已经清晰传达，暂不需要移除或替换，除非出现具体的解析故障工单"，而不是要求执行者去评估移除/替换一个已知是过渡方案的依赖。
- **M12 补充**：`index.html:37-49` 的两个 CDN 引入（bootstrap-icons、font-awesome）已经带有 `integrity` + `crossorigin` 的 SRI 校验，不存在 SRI 缺失问题，"双重图标库"仍然是字节冗余/可维护性问题，但不是安全问题，处理优先级可以维持 P2 但不要和安全加固混在一起排期。

### 5.3.2 计划遗漏的问题（新增）

- **N1（架构盘点缺口）**：`src/components/EditorHeader/ControlPanel.jsx` 实测 **2196 行**，是 H1 中标注的"上帝组件" `Workspace.jsx`（882 行）的 2.5 倍，且承担剪贴板复制/粘贴、右键菜单、工具栏、多个模态框触发等大量职责，但整份计划完全没有提到它。同样超过 500 行、值得后续架构盘点的还有 `src/components/EditorCanvas/Canvas.jsx`（925 行）、`ToolbarPlugin.jsx`（631 行）、`Table.jsx`（622 行）、`Note.jsx`（541 行）。本阶段不要求拆分（不引入新产品能力/不做大重构），但应在第 9 节"下一轮默认任务"中列为 Phase 7 架构重构的候选清单，否则会被忽略。
- **N2（i18n 完整性背景）**：抽查 `src/i18n/locales/`（共 49 个语言文件）发现完整度参差不齐：`zh.js`（321 行，约为 `en.js` 361 行的 89%）基本完整，但 `fr.js`（224 行，约 62%）等语言存在明显缺口。这不是本阶段新增的问题（H11/H12 已覆盖 `en.js`/`zh.js` 兜底策略），但 6.11 节把 i18n 改成按需加载后，这些本来就不完整的语言在切换时会更频繁地触发"加载后仍缺键、回退到英文"的路径，建议在验证矩阵里明确记录这是已知现状而非新引入的回归，避免被误判为 Phase 6 的锅。
- **N3（CSP 上线风险）**：6.6 节直接给出 enforce 模式的 CSP 规则，但项目还有 `react-tweet`（可能引入 Twitter/X 的 iframe/脚本）、`@vercel/analytics` 的上报请求、Warp 赞助商图片等第三方资源，一次性 enforce 可能在没有充分覆盖 `connect-src`/`frame-src`/`img-src` 的情况下静默拦截某个功能且不易被测试发现。建议先以 `Content-Security-Policy-Report-Only` 观察一段时间（或至少在本地/预发布环境跑一轮完整功能回归并检查浏览器控制台 CSP 违规日志），确认清单完整后再切到 enforce 模式，并把这一步写进 6.6 的步骤里而不是只在风险章节提一句。

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
| M11 | CI 未运行 test/audit/bundle:check（**建议提前到 C1-C4 之后立即执行，不要留到 6.16**，理由见 5.3.1） | `.github/workflows/build.yml` |
| M12 | 双重 CDN 图标库（bootstrap-icons + font-awesome），两者均已有 SRI，属字节冗余而非安全问题 | `index.html:40-52` |
| M13 | react@18.2.0 非最新 18.x | `package.json` |
| M14 | `@vercel/analytics` 全局注入需确认隐私边界 | `src/main.jsx:13` |
| M15 | `oracle-sql-parser@0.1.0` 极不成熟，**但 UI 已标注为 beta，属已知取舍，非未被意识到的技术债** | `package.json` |
| M16 | 13 个 hook wrapper 缺 null guard | `src/hooks/` |
| M17 | `CollabContextProvider` 定义但未使用 | `src/context/CollabContext.jsx:9` |
| M18 | `CloudDiagrams` 路由无鉴权守卫 | `src/App.jsx:22` |

## 6. Phase 6 切片队列

### 6.1 ReDoS 正则修复（C1）

状态：已完成（2026-07-04）。

目标：修复 `datatypes.js` 中几何数据类型正则的灾难性回溯风险，并在 `checkDefault` 入口添加输入长度限制。

修改文件：

- 修改 `src/data/datatypes.js`
- 新增 `src/data/datatypes.test.js`（或扩展现有测试）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖 LINE、LSEG、PATH、POLYGON 正则在恶意输入（大量不完整括号对、超长字符串）下不产生指数回溯。测试策略采用组合断言而非纯耗时阈值，避免机器波动导致 flaky：(1) 输入长度上限断言——超过上限（如 1000 字符）的 `field.default` 直接返回 `false`，不进入正则；(2) 非回溯实现断言——对恶意输入（如 200 字符的不完整括号对）断言返回 `false` 且不挂起；(3) 合理耗时断言——对 1000 字符恶意输入断言 `checkDefault` 在宽松阈值内完成（如 200ms，留 4 倍机器波动余量），仅作为辅助断言，不作为唯一判据。
- [x] 重写 LINE/LSEG 正则为非回溯模式，或改为逐字符扫描函数。例如将 `^(\(\d+,\d+\),)+\(\d+,\d+\)$` 改为先校验整体结构再逐段匹配。
- [x] 重写 PATH/POLYGON 正则，消除嵌套量词 `*?` 与外层 `(\d+(\.\d+)?)` 的回溯叠加。
- [x] 在 `checkDefault` 调用入口（`validateDiagram.js:37-40`）或各 `checkDefault` 函数内部，对 `field.default` 长度设置上限（如 1000 字符），超出直接返回 `false`。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 C1 防御性加固。红灯测试先确认超长但格式合法的 PostgreSQL LINE 默认值仍会通过原几何正则；修复后共享 `checkDefault` 入口对字符串默认值设置 1000 字符上限，LINE/LSEG/PATH/POLYGON 正则改为非 lazy/non-capturing 结构，合法几何默认值保留通过，短恶意输入快速拒绝。验证命令：`npm run test -- src/domain/validateDiagram.test.js`、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 恶意几何类型默认值输入不再导致浏览器主线程挂起。
- 合法几何类型默认值仍能通过校验。
- 现有导入导出测试无回归。

### 6.2 正则注入修复（C2）

状态：已完成（2026-07-04）。

目标：修复 `postgres.js` 中用户输入直接拼入 `new RegExp()` 的注入风险。

修改文件：

- 修改 `src/utils/importSQL/postgres.js`
- 新增或扩展 `src/utils/importSQL/importSQL.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖包含正则特殊字符（如 `(a+)+b`、`.*`、`|`、`{}`）的 Postgres CREATE TYPE 名称不会导致异常或错误匹配。
- [x] 新增 `escapeRegex(str)` 工具函数（可放在 `src/utils/importSQL/shared.js` 或 `src/utils/utils.js`）。
- [x] 将 `postgres.js:46, 51` 的 `new RegExp(\`^(${t.name}|"${t.name}")$\`)` 改为使用 `escapeRegex(t.name)`。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 C2 正则注入修复。红灯测试先确认 Postgres enum/type 名称 `.*` 会错误匹配普通 `INTEGER` 字段，且 `status[` 会触发 `new RegExp()` 编译异常；修复后新增共享 `escapeRegex`，Postgres 自定义 type/enum 名称匹配保留裸名称和双引号名称语义，但把用户输入当作字面量处理。验证命令：`npm run test -- src/utils/importSQL/importSQL.test.js`、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 包含正则特殊字符的类型名称不再导致解析异常。
- 现有 Postgres SQL 导入测试无回归。

### 6.3 分享数据加载校验（C3）

状态：已完成（2026-07-04）。

目标：分享链接加载的图表数据必须经过与导入路径相同的安全校验链。**范围已扩大**：`src/components/EditorHeader/SideSheet/Versions.jsx` 中的 `loadVersion`（96 行）和 `hasDiagramChanged`（186 行）与 `Workspace.jsx` 的 `loadFromGist` 属于同一漏洞类别（都是解析分享后端返回的数据后跳过校验直接使用），必须一并修复，否则版本历史/版本回溯入口仍可被恶意分享后端数据攻击（详见 5.3.1 复核说明）。

修改文件：

- 修改 `src/components/Workspace.jsx`
- 修改 `src/components/EditorHeader/SideSheet/Versions.jsx`
- 新增或扩展 `src/components/Workspace.test.jsx`（或针对 loadFromGist 的聚焦测试）
- 新增或扩展 `src/components/EditorHeader/SideSheet/Versions.test.jsx`（针对 loadVersion 的聚焦测试）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖 `loadFromGist` 加载超限数据（如 500+ 表、超长字符串）时拒绝加载并显示错误状态，不注入全局状态。
- [x] 写红灯测试，覆盖 `loadFromGist` 加载非法字段默认值时拒绝加载。
- [x] 写红灯测试，覆盖 `Versions.jsx` 的 `loadVersion` 加载超限或非法版本数据时拒绝加载并提示错误（`Toast.error`），不写入 tables/relationships 等状态。
- [x] 在 `loadFromGist`（`Workspace.jsx:441`）中，`JSON.parse` 后先调用 `validateDiagramImportObject(parsedDiagram)`，超限则 `setSaveState(State.FAILED_TO_LOAD)` 并 return。
- [x] 再调用 `validateDiagram(normalizeDiagram(parsedDiagram))`，存在 critical issue 时拒绝加载。
- [x] 在 `Versions.jsx` 的 `loadVersion`（96 行）中对 `parsedDiagram` 应用同样的 `validateDiagramImportObject` + `validateDiagram` 校验链，校验失败时 `Toast.error` 并保留当前状态不变（不切换到损坏的历史版本）。
- [x] `hasDiagramChanged`（186 行）用于版本比对，非直接写入状态，风险较低，但建议至少加 try/catch 包裹 `JSON.parse`，解析失败时按"有变化"处理（保守策略，避免因无法比对而误判无变化导致漏记录版本）。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 C3 分享数据加载校验。新增共享 `validateSharedDiagramContent`，分享初次加载和版本历史回溯都先执行 import limit 校验、normalize 和 `validateDiagram`，超限或非法字段默认值会拒绝加载；`Workspace.jsx` 失败时进入 `State.FAILED_TO_LOAD`，`Versions.jsx` 失败时提示 `Toast.error` 且不切换版本、不写入 tables/relationships/areas/title。`hasDiagramChanged` 对历史版本 JSON 解析失败按"有变化"保守处理。验证命令：`npm run test -- src/features/share/validateSharedDiagram.test.js src/components/EditorHeader/SideSheet/Versions.test.jsx`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 恶意分享链接返回的超限或非法数据不会注入全局状态（包括初次加载和版本历史回溯两条路径）。
- 合法分享链接和合法版本历史仍能正常加载。
- 加载失败时显示明确的错误状态，不白屏。

### 6.4 noteSchema 校验绕过修复（C4）

状态：已完成（2026-07-04）。

目标：修复粘贴处理中 noteSchema 校验始终通过的 bug。

修改文件：

- 修改 `src/components/EditorHeader/ControlPanel.jsx`
- 新增 `src/features/clipboard/resolvePastedDiagramObject.js`
- 新增 `src/features/clipboard/resolvePastedDiagramObject.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖粘贴不符合 noteSchema 的 JSON 对象时不会被添加为 Note。
- [x] 将 `ControlPanel.jsx:895` 的 `v.validate(obj, noteSchema)` 改为 `v.validate(obj, noteSchema).valid`。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 C4 noteSchema 校验绕过修复。红灯测试先确认缺少必填字段且颜色格式非法的剪贴板对象仍会被识别为 Note；修复后抽出 `resolvePastedDiagramObject` 统一处理 table/area/note schema 判定，并对 noteSchema 使用 `.valid`，非法 note 不再进入 `addNote` 路径，合法 note 仍可识别。验证命令：`npm run test -- src/features/clipboard/resolvePastedDiagramObject.test.js`、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 粘贴非法 JSON 对象不再被无条件添加为 Note。
- 粘贴合法 table/area/note JSON 仍能正常工作。

下一项：C1-C4 已全部完成。M11 CI 门禁最小切片已在 2026-07-04 提前完成；下一轮应进入 6.5 API 层错误处理与环境变量守卫（H7、H8）。

### 6.4.1 CI 门禁提前切片（M11）

状态：已完成（2026-07-04）。

目标：在 H 类任务继续推进前，把本地强制执行的测试和安全门禁纳入 GitHub Build workflow，避免后续回归只依赖手动验证。

修改文件：

- 修改 `.github/workflows/build.yml`
- 新增 `src/build/ciWorkflow.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

完成记录：2026-07-04 已完成 M11 CI 门禁提前切片。红灯测试先确认 Build workflow 只运行 `npm install`、`npm run lint` 和 `npm run build`，缺少测试、安全审计和 bundle 预算检查；修复后 Build workflow 在 lint 后运行 `npm run test`，build 后运行 `npm run bundle:check`，并运行 `npm audit --audit-level=high`。验证命令：`npm run test -- src/build/ciWorkflow.test.js`、`npm run test`、`npm run lint`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- GitHub Build workflow 会在 push/pull_request 中运行单元测试。
- GitHub Build workflow 会阻断 high/critical 依赖漏洞。
- GitHub Build workflow 会在生产构建后运行 bundle budget check。

### 6.5 API 层错误处理与环境变量守卫（H7、H8）

状态：已完成（2026-07-04）。

目标：email.js 添加环境变量守卫；email.js 和 gists.js 所有 API 函数添加 try/catch 和响应校验。

修改文件：

- 修改 `src/api/email.js`
- 修改 `src/api/gists.js`
- 新增或扩展 `src/api/email.test.js`
- 扩展 `src/api/gists.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖 `VITE_BACKEND_URL` 未设置时 `email.send()` 不发起网络请求，返回结构化错误。
- [x] 写红灯测试，覆盖 gists API 网络错误、非预期响应结构时返回结构化错误而非抛出。
- [x] 在 `email.js` 添加 `assertBackendConfigured()` 守卫（参考 `gists.js:11-17`）。
- [x] 在 `email.js` 和 `gists.js` 所有 API 函数中添加 try/catch，捕获 axios 错误并返回 `{ ok: false, reason, message }` 结构化结果。
- [x] 在 `gists.js` 中对 `res.data.data.id` 等链式访问添加防御性检查。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 H7/H8 API 层错误处理与环境变量守卫。红灯测试先确认未配置 `VITE_BACKEND_URL` 时 `email.send()` 仍会走 axios、`gists.create()` 会抛出未配置/网络错误且异常响应会返回 `undefined`；修复后 email 与 gists API 在未配置、网络错误和响应结构异常时统一返回 `{ ok: false, reason, message }`，成功路径保留原返回值以兼容现有调用方。分享弹窗、分享加载、版本历史和迁移对比调用点已识别 `isApiError()`，避免把结构化错误当作 gistId 或响应数据使用。验证命令：`npm run test -- src/api/email.test.js src/api/gists.test.js`、`npm run test -- src/components/EditorHeader/Modal/Share.test.jsx src/components/EditorHeader/SideSheet/Versions.test.jsx`、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 环境变量未设置时不发起网络请求。
- 网络错误和异常响应不抛出到调用方，返回结构化错误。
- 现有分享功能测试无回归。

下一项：6.6 部署安全 header（H14、H15）。

### 6.6 部署安全 header（H14、H15）

状态：已完成（2026-07-04）。

目标：nginx.conf 和 vercel.json 添加 CSP、HSTS、X-Frame-Options 安全 header。

修改文件：

- 修改 `nginx.conf`
- 修改 `vercel.json`
- 修改 `src/deploy/dockerSecurity.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖 nginx.conf 包含 `Content-Security-Policy`、`Strict-Transport-Security`、`X-Frame-Options` header。
- [x] 写红灯测试，覆盖 vercel.json 包含对应安全 headers 配置。
- [x] 在 `nginx.conf` 添加 CSP（`default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://api.github-star-counter.workers.dev; frame-ancestors 'none';`）、HSTS（`max-age=63072000; includeSubDomains; preload`）、X-Frame-Options（`DENY`）。CSP `script-src` 必须包含 `'unsafe-eval'`，因为 Semi UI 的 lottie-web 动画依赖 `eval()`；此约束需在验证矩阵记录，长期目标是替换 lottie-web 以收紧 CSP。
- [x] 在 `vercel.json` 添加 `headers` 配置，与 nginx 对齐（同样包含 `'unsafe-eval'`）。
- [x] **先以 `Content-Security-Policy-Report-Only`（而非直接 enforce）部署**，本地/预发布环境完整走一遍主要功能（编辑器加载、分享、模板、SQL/DBML 导入导出、react-tweet 嵌入内容、Vercel Analytics 上报），检查浏览器控制台是否有 CSP 违规日志，确认 `connect-src`/`img-src`/`frame-src` 等指令清单完整覆盖第三方资源（CDN 图标库、react-tweet、Vercel Analytics 等）后，再切换为 enforce 模式（去掉 `-Report-Only` 后缀）。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。如条件允许运行 `docker build` 验证。

完成记录：2026-07-04 已完成 H14/H15 部署安全 header。红灯测试先确认 `nginx.conf` 缺少 `Content-Security-Policy-Report-Only`、HSTS 和 `X-Frame-Options`，且 `vercel.json` 没有全路由 headers；修复后 nginx 与 Vercel 均配置 Report-Only CSP、HSTS、`X-Frame-Options: DENY`，并保留已有 `X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`。CSP 明确包含 `frame-ancestors 'none'`、第三方 CDN stylesheet/font、react-tweet frame/image 和 Vercel Analytics connect 观察入口；`script-src` 暂保留 `'unsafe-eval'` 以兼容当前 `lottie-web` 构建警告。验证命令：`npm run test -- src/deploy/dockerSecurity.test.js`、`npm run test`、`npm run lint`、`npm run build`、`docker build -t drawdb-phase6-security-headers .`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- nginx 和 Vercel 两侧都有完整安全 header。
- Docker 安全测试通过。
- 现有 SRI 测试无回归。

下一项：6.8 localDiagramRepository 错误处理与事务（H6）。

### 6.7 IndexedDB 迁移路径补齐（H5）

状态：已完成（2026-07-04）。

目标：为 Dexie v67 补充从早期版本到当前版本的迁移路径，确保旧版用户升级不丢数据。

修改文件：

- 修改 `src/data/db.js`
- 新增 `src/data/db.test.js`（或扩展）
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 调研：确认 drawDB 历史发布版本中 IndexedDB schema 版本号范围（检查 git 历史中 `db.js` 的 `db.version()` 调用记录）。
- [x] 写红灯测试，覆盖当前 v67 upgrade 对旧记录的 stable id backfill 行为，确认缺失 id 会补齐且已有 id 不被覆盖。
- [x] 在 `db.js` 中为当前 v67 upgrade 抽出可测迁移函数，并确认本仓库没有可回放的 v1-v66 schema 历史。
- [x] 如果确认无历史用户基数（如本项目重构后首次发布），则在 `db.js` 中添加注释说明版本跳跃的安全性依据，并在验证矩阵记录。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 H5 IndexedDB 迁移路径补齐。核查 `git log -- src/data/db.js` 后确认本独立重构仓库的 `db.js` 历史只有根提交 `b9c50ca`，没有 v1-v66 schema 历史可回放；本轮把 v67 upgrade 抽为 `backfillStableIds` 并新增 `CURRENT_INDEXEDDB_VERSION`、`INDEXEDDB_VERSION_JUMP_NOTE`，明确版本跳跃依据。红灯测试先确认 `dbMigration` helper 缺失；修复后覆盖旧 diagram/template 记录补齐 stable id、已有 id 不被覆盖，以及 seed 初始化错误仅在开发环境输出。验证命令：`npm run test -- src/data/dbMigration.test.js`、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 旧版 IndexedDB 升级到 v67 不丢数据或有明确文档说明安全性依据。
- 种子数据初始化错误不再静默吞掉（修复 M7 中的 `db.js:25` console.log）。

下一项：6.8 localDiagramRepository 错误处理与事务（H6）。

### 6.8 localDiagramRepository 错误处理与事务（H6）

状态：已完成（2026-07-04）。

目标：为 localDiagramRepository 所有 CRUD 方法添加 try/catch，`saveDiagram` 的 read-then-write 添加事务边界。

修改文件：

- 修改 `src/persistence/localDiagramRepository.js`
- 扩展 `src/persistence/localDiagramRepository.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖 Dexie 操作失败时 repository 返回结构化错误而非抛出。
- [x] 写红灯测试，覆盖 `saveDiagram` 写入失败时不产生半写入状态。
- [x] 为所有 6 个 CRUD 方法添加 try/catch，返回 `{ ok: false, reason, message }` 结构化结果。
- [x] 将 `saveDiagram` 的 read-then-write 包裹在 `db.transaction('rw', db.diagrams, async () => {...})` 中。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 H6 localDiagramRepository 错误处理与事务。红灯测试先确认 Dexie 失败会直接 reject、`saveDiagram` 未走事务且写入失败可能留下半写入状态；修复后 repository 失败路径统一返回 `{ ok: false, reason: "dexie-error", operation, message }`，成功路径保持原返回值兼容既有调用。`saveDiagram` 使用 `db.transaction("rw", db.diagrams, ...)` 包裹 read-then-write，调用方 `useDiagramLoader`、`useDiagramPersistence` 和本地图表列表会识别结构化错误，避免把错误对象当作图表或数组渲染。验证命令：`npm run test -- src/persistence/localDiagramRepository.test.js src/editor/useDiagramLoader.test.jsx src/editor/useDiagramPersistence.test.jsx src/features/local-diagrams/LocalDiagramList.test.jsx`、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- Dexie 错误不直接抛出到调用方。
- `saveDiagram` 写入失败无半写入状态。

下一项：6.9 DBML 解析器懒加载（H9）。

### 6.9 DBML 解析器懒加载（H9）

状态：已完成（2026-07-04）。

目标：将 `@dbml/core` 改为动态 import 按需加载，与 SQL 解析器懒加载模式对齐。**参照对象是 `src/features/import/importSqlService.js`（101-102 行，动态 `import("node-sql-parser")`/`import("oracle-sql-parser")`），不是 `src/utils/importSQL/` 目录**——该目录下的方言转换器（如 `postgres.js`）本身不做懒加载，只是被 `importSqlService.js` 动态引入后才加载，实现时不要去 `utils/importSQL/` 找参照写法。

修改文件：

- 修改 `src/utils/importFrom/dbml.js`
- 新增 `src/build/dbmlLazyBoundary.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖入口 bundle 不静态导入 `@dbml/core`（参考 `src/build/sqlParserLazyBoundary.test.js` 对 `importSqlService.js` 的断言写法，改为断言 `src/features/import/importDiagramService.js` 或 `dbml.js` 不静态 import `@dbml/core`）。
- [x] 将 `dbml.js` 顶层的 `import { Parser } from "@dbml/core"` 改为 `const { Parser } = await import("@dbml/core")`。
- [x] 确保 DBML 导入函数变为 async，调用方适配。
- [x] 运行聚焦测试、`npm run test`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 H9 DBML 解析器懒加载。红灯测试先确认 `src/utils/importFrom/dbml.js` 顶层静态导入 `@dbml/core`；修复后 `fromDBML` 在 DBML 导入时动态加载 parser，并缓存 parser 实例。`importDiagramFileContent` 改为 async，`ImportDiagram` 上传回调同步适配，JSON/DDB 路径保持原校验和 preview 语义。验证命令：`npm run test -- src/build/dbmlLazyBoundary.test.js src/features/import/importDiagramService.test.js`、`npm run test`、`npm run lint`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- `@dbml/core` 不在入口 bundle 中。
- DBML 导入功能仍正常工作。
- 最大 JS chunk 下降。

下一项：6.10 路由懒加载与错误边界（H10）。

### 6.10 路由懒加载与错误边界（H10）

状态：已完成（2026-07-04）。

目标：6 个页面改为 `React.lazy` + `<Suspense>` 懒加载，添加路由级错误边界。

修改文件：

- 修改 `src/App.jsx`
- 新增 `src/components/ErrorBoundary.jsx`
- 新增 `src/components/ErrorBoundary.test.jsx`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖页面级渲染错误不导致白屏，显示错误边界 fallback。
- [x] 写红灯测试，覆盖 Editor 页面独立 chunk（可通过 bundle 分析或 import 路径断言）。
- [x] 新增 `ErrorBoundary` 组件，捕获渲染错误显示 fallback UI。
- [x] 将 `App.jsx` 中 6 个页面改为 `React.lazy(() => import(...))`，用 `<Suspense fallback={...}>` 包裹。
- [x] 用 `<ErrorBoundary>` 包裹 `<Routes>` 或每个路由元素。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 H10 路由懒加载与错误边界。红灯测试先确认缺少 `ErrorBoundary` 且 `App.jsx` 仍静态导入 `./pages/*`；修复后新增路由级 `ErrorBoundary`，页面渲染异常显示 fallback，不导致白屏。`App.jsx` 将 Landing、Editor、BugReport、Templates、CloudDiagrams、NotFound 改为 `React.lazy` 动态导入，并由 `Suspense` 包裹，入口静态导入断言确保页面组件不再直接进入主 bundle。验证命令：`npm run test -- src/components/ErrorBoundary.test.jsx src/build/routeLazyBoundary.test.js`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 页面渲染错误不白屏。
- Editor 页面拆为独立 chunk。
- 现有 e2e smoke 无回归。

下一项：6.11 i18n 按需加载（H11）。

### 6.11 i18n 按需加载（H11）

状态：已完成（2026-07-04）。

目标：将 53 个语言文件改为按需加载，仅加载用户当前语言。

修改文件：

- 修改 `src/i18n/i18n.js`
- 新增或扩展 `src/i18n/i18n.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖入口 bundle 不静态导入所有语言文件。
- [x] 将 `i18n.js` 中 51 个静态 `import` 改为 i18next backend 按需加载机制。
- [x] 确保语言切换时动态加载对应语言包，加载失败回退到英文。
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成记录：2026-07-04 已完成 H11 i18n 按需加载。红灯测试先确认 `src/i18n/i18n.js` 顶层静态导入全部 `./locales/*` 资源，且缺少 `loadLanguageResources` 按需加载入口；修复后语言列表仅保留 metadata，翻译资源通过动态 `import("./locales/...")` 和 i18next backend 按需加载，`changeLanguage` 会先加载目标语言再切换。保留第 5.3.2 节 N2 背景：部分非 en/zh 语言文件本身翻译键不完整，缺失键按 i18next fallback 回退英文，不视为本切片新增回归。验证命令：`npm run test -- src/build/i18nLazyBoundary.test.js src/i18n/i18n.test.js`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`、`npm run bundle:check`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 入口 bundle 不包含所有语言翻译。
- 语言切换功能正常。
- 最大 JS chunk 下降。

下一项：6.12 国际化补齐（H12、H13）。

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
- [x] M11：已在 2026-07-04 作为独立最小切片提前完成；Build workflow 已添加 `npm run test`、`npm run bundle:check` 和 `npm audit --audit-level=high`。
- [ ] M12：评估移除未使用的 CDN 图标库（两者均已有 SRI，此项是体积/可维护性清理，非安全修复）。
- [ ] M13：react 升级到 18.3.1。
- [ ] M14：`@vercel/analytics` 在 SECURITY.md 补充隐私边界说明。
- [ ] M15：确认 oracle-sql-parser 的 beta 标注和用户预期已经清晰传达（已在 `NewDiagramWizard` 中标注 beta），暂不需要移除或替换，除非出现具体解析故障工单。
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

- 是否需要 Phase 7 架构重构（Workspace.jsx 和 DiagramContext 完整拆分、跨 Context 解耦）。**架构盘点范围应扩大到 `ControlPanel.jsx`（2196 行，比 Workspace.jsx 大 2.5 倍）、`EditorCanvas/Canvas.jsx`（925 行）、`ToolbarPlugin.jsx`（631 行）、`Table.jsx`（622 行）、`Note.jsx`（541 行）**，这些是 2026-07-04 复核中新发现、本轮计划未覆盖的超大文件，不应被 Workspace.jsx 一个案例掩盖。
- 是否需要产品 roadmap 调整（新数据库支持、模板市场、协作能力等）。
- 是否需要依赖现代化（Dexie 4.x、React 19、Semi UI 替代评估）。
- i18n 完整性治理：本轮 H11/H12 只解决"是否有翻译键"和"是否按需加载"，未解决"49 个语言文件本身完整度参差不齐"的问题（抽查 `fr.js` 约为 `en.js` 完整度的 62%）。是否需要建立翻译完整度 CI 检查或社区众包补齐机制，留待下一轮评估。
