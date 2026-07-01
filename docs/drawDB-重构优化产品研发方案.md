# drawDB 重构优化产品功能设计与研发计划

版本：2026-07-01

## 1. 文档目标

本文用于指导 drawDB 后续优化重构，覆盖产品边界、功能设计、技术架构、研发拆分、验收标准和测试策略。

本方案基于当前独立重构仓库的真实状态：drawDB 是一个以浏览器端本地编辑为核心的数据库 ERD 编辑器，支持本地 IndexedDB 保存、模板、SQL/DBML/JSON 导入导出、图片/PDF/Markdown/Mermaid 导出，以及依赖可选后端的分享和版本功能。

当前重构项目以 `https://github.com/Lynn-Lee/drawDB.git` 作为唯一远端仓库推进，不再跟踪任何外部仓库历史。后续产品和工程计划均以本仓库 `main` 分支为基线。

Phase 0 已完成安全与工程底座切片，并通过阶段退出门禁：测试、浏览器 smoke、导入限制、分享确认、Docker/nginx 安全 headers 和外部资源完整性治理均已有验证记录。下一阶段进入 Phase 1，先建立 Domain Model、命令历史和本地持久化 repository，不改变默认本地无账号体验。

## 2. 产品定位

### 2.1 核心定位

drawDB 应定位为“隐私优先、无需账号、可离线使用的数据库结构设计与 SQL 生成工具”。

默认形态必须继续保留无账号、本地保存、浏览器内完成建模的核心优势。账号登录、云端同步和团队协作应作为可选增强能力，而不是默认前置条件。

### 2.2 产品模式

1. 本地模式
   - 默认模式。
   - 不需要账号。
   - 图表保存到 IndexedDB。
   - 所有导入导出在浏览器内完成。
   - 明确提示数据不会自动上传。

2. 分享模式
   - 用户主动点击分享后启用。
   - 将当前图表上传到配置的后端服务。
   - 需要明确提示“分享会把图表数据发送到服务器”。
   - 支持撤销分享。

3. 云端模式
   - 后续可选商业/协作能力。
   - 支持账号登录、云端保存、版本历史、团队权限。
   - 不应破坏本地模式，也不应强制登录。

## 3. 用户与场景

### 3.1 目标用户

1. 后端工程师
   - 快速设计数据库表结构。
   - 从已有 SQL 反向生成 ERD。
   - 导出 SQL、DBML、Markdown 文档。

2. 全栈/独立开发者
   - 在无账号、低摩擦环境下快速建模。
   - 保存多个本地项目。
   - 需要轻量分享给同事或客户。

3. 数据库/架构评审人员
   - 阅读现有 schema。
   - 检查外键、索引、主键和循环依赖。
   - 导出审阅材料。

4. 团队协作用户
   - 需要云端保存、权限控制、版本对比。
   - 属于后续可选云端阶段。

## 4. 信息架构

### 4.1 页面结构

1. Landing
   - 产品价值说明。
   - 进入编辑器。
   - 进入模板库。
   - 文档和 GitHub 链接。
   - 不承担复杂工作流。

2. Templates
   - 官方模板。
   - 用户自定义模板。
   - 模板预览。
   - 从模板创建新图。

3. Editor
   - 主要工作台。
   - 图表建模、导入导出、保存、分享、版本、设置全部围绕此页组织。

4. Bug Report
   - 反馈入口。
   - 如果配置后端，可发送邮件。
   - 如果未配置后端，应降级为 GitHub issue/复制诊断信息。

5. Account / Cloud，可选
   - 登录。
   - 图表列表。
   - 团队空间。
   - 权限管理。
   - 云同步状态。

### 4.2 编辑器布局

编辑器应拆为四个稳定区域：

1. Header
   - 文件名、保存状态、分享入口、账号入口（可选）。
   - 菜单只放全局动作。

2. Side Panel
   - 结构化编辑区。
   - Tables、Relationships、Areas、Notes、Types、Enums、Issues。
   - DBML 视图作为只读或可编辑模式明确标注。

3. Canvas
   - 图形编辑区。
   - 拖拽、连线、缩放、框选、右键/快捷操作。

4. Floating Toolbar
   - 高频操作：缩放、撤销重做、新增表、区域、注释、保存。
   - 所有 icon-only 按钮必须有可访问名称。

## 5. 全局产品原则

1. 本地优先
   - 所有核心能力必须无账号可用。
   - 云端能力只做增强。

2. 非可信输入默认不安全
   - SQL、DBML、JSON、分享链接内容都需要大小、复杂度、结构和引用完整性校验。

3. 结构和画布双入口
   - 画布适合空间关系。
   - 侧栏适合精确编辑。
   - 两者必须共享同一 domain model。

4. 导入导出必须可验证
   - 每个数据库 dialect 建 golden fixtures。
   - 不追求支持所有 SQL，但必须清楚支持范围和失败原因。

5. 可访问性是功能质量的一部分
   - 键盘可达、按钮命名、焦点状态、错误恢复都纳入验收。

## 6. 功能模块设计

### 6.1 首次进入与新建图表

目标：让用户清楚选择数据库、模板或导入路径，而不是进入空白复杂编辑器。

功能设计：

1. 首次进入 `/editor`
   - 如果没有本地最近图，展示新建向导。
   - 向导提供三条路径：选择数据库新建、从模板开始、导入 SQL/DBML/JSON。
   - 明确提示“默认保存到当前浏览器本地”。

2. 有最近图
   - 默认恢复最近图。
   - Header 显示“已从本地恢复”。
   - 提供“新建空白图”“打开其他图”“导入”。

3. 数据库选择
   - 支持 Generic、MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle。
   - Beta 数据库必须标注能力限制。

验收标准：

- 新用户 30 秒内可以创建第一个表。
- 未配置后端时不出现误导性的云端能力。
- 刷新页面后能恢复最近图并显示保存来源。

### 6.2 本地图表管理

目标：把 IndexedDB 中的图表变成清晰的本地项目管理能力。

功能设计：

1. 图表列表
   - 显示名称、数据库类型、表数量、最近修改时间、来源。
   - 支持搜索、删除、复制、导出。

2. 最近打开
   - Header 菜单展示最近 10 个。
   - 如果 IndexedDB 异常，提供恢复提示。

3. 保存与另存为
   - 自动保存默认开启。
   - 保存状态分为 Unsaved、Saving、Saved、Error。
   - 另存为创建新 diagramId，不覆盖旧图。

4. 本地备份
   - 支持导出全部本地数据为 zip。
   - 文件名使用日期和时间，避免当前 `getMonth/getDay` 造成误导。
   - zip 内文件名需要安全化，避免特殊字符导致兼容问题。

验收标准：

- IndexedDB 损坏或 settings JSON 损坏不会导致白屏。
- 自动保存失败时用户能看到恢复动作。
- 导出的 zip 可重新导入。

### 6.3 画布编辑

目标：提供稳定、可扩展、可测试的 ERD 图形编辑体验。

功能设计：

1. 基础交互
   - 平移、缩放、重置视图、适应窗口。
   - 表、区域、注释可拖拽。
   - 框选支持多选。
   - 锁定对象不可移动。

2. 表格渲染
   - 表头显示表名、锁定、折叠、更多操作。
   - 字段显示名称、类型、主键、唯一、可空、默认值摘要。
   - 可配置显示注释和数据类型。

3. 关系连线
   - 从字段 grip 创建关系。
   - 支持单字段和复合外键。
   - 支持 cardinality、on update、on delete。
   - 关系标签可显示/隐藏。

4. 性能要求
   - 100 表流畅编辑。
   - 500 表可查看、搜索、选择。
   - 1000 表至少可打开、导出、查看结构，画布可降级为概览模式。

研发要求：

- 将画布交互拆成 `pointer state`、`selection state`、`viewport state`、`diagram commands`。
- 拖拽期间避免每个 pointer move 全量触发所有大组件重渲染。
- 后续可引入视口裁剪或专用 canvas/SVG 分层。

验收标准：

- 拖拽 100 表图时无明显卡顿。
- 所有画布动作都能撤销/重做。
- 键盘可以触发核心命令。

### 6.4 表结构建模

目标：让数据库结构编辑准确、可验证，并可映射到导入导出。

功能设计：

1. 表
   - 新增、删除、重命名、复制、锁定、折叠、设置颜色、注释。
   - 表名重复、空名、保留字需要提示。

2. 字段
   - 新增、删除、重命名、排序。
   - 类型、长度、精度、默认值、check、注释。
   - primary、unique、not null、auto increment。
   - 对不同数据库显示不同可用属性。

3. 索引
   - 普通索引、唯一索引。
   - 多字段索引。
   - 空索引、重复索引名提示。

4. 唯一约束
   - 独立于字段 unique。
   - 支持多字段。
   - 导出 SQL 时按数据库 dialect 生成。

5. 继承/扩展
   - PostgreSQL inheritance 之类能力必须明确只在哪些数据库启用。
   - 不支持的数据库隐藏或标注不可导出。

验收标准：

- 不同数据库下字段类型和属性合法性不同。
- 修改表名/字段名后关系和导出保持一致。
- 所有 schema issue 可定位到具体对象。

### 6.5 关系建模

目标：外键建模必须从“画线”升级为“数据库约束设计”。

功能设计：

1. 创建关系
   - 画布拖线创建。
   - 侧栏表单创建。
   - 支持复合外键。

2. 编辑关系
   - 关系名。
   - 起点表/字段，终点表/字段。
   - cardinality。
   - on update / on delete。

3. 校验
   - 引用表不存在。
   - 引用字段不存在。
   - 类型不兼容。
   - 复合外键字段数量不一致。
   - 关系名重复。

验收标准：

- 删除字段或表时，受影响关系有明确提示或自动清理并可撤销。
- 复合 FK 可导入、编辑、导出。

### 6.6 自定义类型与枚举

目标：统一 Type、Enum、字段类型和数据库 dialect 的边界。

功能设计：

1. Enums
   - PostgreSQL/Generic 等支持时显示。
   - 名称、值列表、引用字段。
   - 删除前提示影响字段。

2. Custom Types
   - 用于 PostgreSQL composite type 等。
   - 字段结构独立管理。
   - 和字段类型引用建立显式关系。

3. 类型配置
   - 用户可新增本地自定义类型颜色。
   - 导出/分享时只携带当前图使用的自定义类型。

验收标准：

- 类型 ID 全部统一为 string。
- 类型重命名会同步引用字段。
- 删除类型时有影响分析。

### 6.7 注释与主题区域

目标：支持架构说明和分组，不影响数据库导出。

功能设计：

1. Notes
   - 标题、内容、颜色、大小、锁定。
   - 富文本编辑保留，但输出到 Markdown 时转为安全格式。

2. Subject Areas
   - 名称、颜色、大小、锁定。
   - 支持作为可视化分区。

3. 导出行为
   - JSON/DDB 保存完整。
   - SQL 导出不包含。
   - Markdown/Mermaid 可包含说明。

验收标准：

- Notes 和 Areas 可撤销/重做。
- Markdown 导出不会产生未转义的危险内容。

### 6.8 导入功能

目标：把“能解析”改造成“可预期、可诊断、可回滚”的导入流程。

功能设计：

1. JSON/DDB 导入
   - 校验文件大小。
   - 校验 schema 版本。
   - 校验必要字段。
   - 校验关系引用完整性。
   - 支持覆盖当前图或作为新图导入。

2. DBML 导入
   - 显示解析错误行列。
   - 支持 enum、table、index、ref。
   - 不支持语法给出明确提示。

3. SQL 导入
   - 按数据库选择 parser。
   - 支持 CREATE TABLE、ALTER TABLE ADD FK、INDEX、UNIQUE、COMMENT、DEFAULT、CHECK 的明确子集。
   - 解析前限制文本大小和语句数量。
   - 解析后展示预览：将导入多少表、关系、类型、枚举。

4. 导入模式
   - 覆盖当前图。
   - 合并到当前图。
   - 另存为新图。

验收标准：

- 恶意大文件不会卡死浏览器。
- 解析失败不清空当前图。
- 导入结果可撤销或可恢复。

### 6.9 导出功能

目标：导出结果稳定、可解释、可回归测试。

功能设计：

1. SQL 导出
   - 按当前数据库导出。
   - Generic 模式可选择目标数据库。
   - 支持表、字段、主键、唯一、索引、外键、枚举、类型。
   - 导出前运行 issue 检查，严重问题阻止导出或要求确认。

2. JSON/DDB 导出
   - JSON 用于开放交换。
   - DDB 用于完整项目备份。
   - 带 schemaVersion。

3. DBML 导出
   - 明确只读 DBML 与可编辑 DBML 的差异。
   - 可后续升级为双向编辑。

4. Mermaid/Markdown
   - 用于文档。
   - 包含标题、数据库类型、表、字段、关系、注释。

5. PNG/JPEG/SVG/PDF
   - 支持大图导出前缩放预览。
   - 失败时给出可操作错误。

验收标准：

- 每种导出都有 golden test。
- 文件名安全，不能包含非法路径字符。
- 空图导出有明确提示。

### 6.10 问题检查与质量提示

目标：从简单 issue list 升级为结构化 schema lint。

功能设计：

1. 检查级别
   - Error：阻止导出或保存。
   - Warning：允许继续但提示。
   - Info：建议优化。

2. 检查范围
   - 空表名、空字段名。
   - 重复表名、重复字段名。
   - 缺主键。
   - 类型和默认值不匹配。
   - 外键引用缺失。
   - 循环依赖。
   - 数据库 dialect 不支持的属性。

3. 交互
   - 点击 issue 定位到对象。
   - 支持按级别过滤。

验收标准：

- issue 必须有 objectId、objectType、severity、message、fixHint。
- 导出 SQL 前运行检查。

### 6.11 版本与迁移

目标：将当前基于 gist 文件版本的能力抽象为通用版本服务。

功能设计：

1. 本地版本，可选
   - 用户手动创建 snapshot。
   - 本地保存最近 N 个版本。
   - 可查看和恢复。

2. 分享/云端版本
   - 如果配置后端，版本由后端保存。
   - 支持比较两个版本。
   - 生成迁移 SQL。

3. 迁移生成
   - 基于 domain diff。
   - 支持新增/删除/修改表、字段、索引、约束、外键。
   - 高风险动作需要警示。

验收标准：

- 恢复版本不会静默覆盖当前图，必须确认。
- 迁移 SQL 对每个数据库有 fixture。

### 6.12 分享与嵌入

目标：清晰区分本地数据和外发数据。

功能设计：

1. 分享链接
   - 点击分享时生成或更新远端副本。
   - 显示数据外发提示。
   - 显示当前分享状态。
   - 支持取消分享。

2. Embed
   - 支持主题、隐藏 header/sidebar/toolbar。
   - 默认只读。
   - URL 参数必须白名单校验。

3. 权限
   - 开源默认分享为“知道链接可读”。
   - 云端阶段支持私有、只读、可编辑、团队权限。

验收标准：

- 未配置后端时分享按钮不应只显示泛错误，应提示配置缺失。
- 分享内容包含 schemaVersion。

### 6.13 设置、快捷键和国际化

目标：让个性化配置可靠、可恢复、可发现。

功能设计：

1. 设置
   - 主题、网格、吸附、显示类型、显示关系标签、表宽、语言、自动保存。
   - settings 存储增加版本和安全 parse。

2. 快捷键
   - 提供快捷键面板。
   - 和菜单展示保持一致。
   - 输入框/代码编辑器内避免误触全局快捷键。

3. 国际化
   - 语言资源按需加载。
   - 缺失 key 在开发环境报警。
   - 运行时语言切换不破坏布局。

验收标准：

- 损坏 settings 不导致白屏。
- 常用快捷键有文档和 UI 提示。

### 6.14 可访问性与响应式

目标：核心流程至少满足 WCAG 2.1 AA 的工程基线。

功能设计：

1. 可访问名称
   - 所有 icon-only button 必须有 aria-label。
   - 图片必须有 alt 或明确 decorative。

2. 键盘操作
   - 菜单、弹窗、侧栏、表单可键盘操作。
   - 焦点可见。
   - Escape/Enter 行为一致。

3. 移动端策略
   - Landing 完全响应式。
   - Editor 移动端优先提供预览、结构编辑和导入导出。
   - 复杂画布编辑可以标注“桌面体验最佳”。

验收标准：

- axe smoke 无严重问题。
- 移动端无横向溢出。
- 无名按钮数量为 0。

### 6.15 安全与隐私

目标：降低前端工具常见的输入、供应链和数据外发风险。

功能设计：

1. 输入安全
   - JSON/SQL/DBML 文件大小限制。
   - 表数量、字段数量、关系数量限制。
   - 字符串长度限制。
   - 解析超时和失败恢复。

2. 输出安全
   - Markdown、DBML、SQL 字符串转义。
   - 文件名安全化。
   - 图片/PDF 导出失败提示。

3. 网络安全
   - 未配置后端时禁用外发功能。
   - 分享前确认。
   - 错误日志不包含图表内容。

4. 部署安全
   - Docker nginx 加 CSP、X-Content-Type-Options、Referrer-Policy、Permissions-Policy。
   - 外部 CDN 资源本地化或加 SRI。

验收标准：

- `npm audit` 无 high/critical。
- 分享动作必须有明确用户触发。
- 大文件导入不会冻结主线程。

### 6.16 可选账号与云端协作

目标：在不破坏本地模式的前提下支持商业化和团队协作。

功能设计：

1. 登录
   - 支持邮箱密码或 OAuth。
   - 本地模式不要求登录。
   - 登录后可选择“上传当前本地图”。

2. 云端图表
   - 我的图表。
   - 团队图表。
   - 最近打开。
   - 权限：owner、editor、viewer。

3. 同步
   - 自动保存到云端。
   - 本地草稿缓存。
   - 冲突检测：本地版本和云端版本不一致时要求选择。

4. 协作，后续阶段
   - presence。
   - 远端变更同步。
   - 评论和审阅。

验收标准：

- 未登录用户仍可完成核心功能。
- 登录状态失效不会丢失本地未保存更改。
- 权限不足时 UI 进入只读。

## 7. Domain Model 重构

### 7.1 核心实体

建议统一为以下模型：

1. Diagram
   - id
   - schemaVersion
   - title
   - database
   - tables
   - relationships
   - areas
   - notes
   - enums
   - customTypes
   - viewport
   - metadata

2. Table
   - id
   - name
   - fields
   - indices
   - uniqueConstraints
   - comment
   - position
   - presentation

3. Field
   - id
   - name
   - type
   - size
   - default
   - check
   - constraints
   - comment

4. Relationship
   - id
   - name
   - startTableId
   - endTableId
   - fieldPairs
   - cardinality
   - updateConstraint
   - deleteConstraint

5. DiagramCommand
   - type
   - payload
   - before
   - after
   - timestamp

### 7.2 关键规则

1. 所有 id 统一为 string。
2. 所有导入数据先 normalize，再进入状态。
3. 所有 UI 操作通过 command 修改 domain model。
4. Undo/redo 基于 command，不写在 ControlPanel。
5. Persistence 层只保存 normalized diagram。

## 8. 技术架构设计

### 8.1 目标分层

1. `domain`
   - 类型定义。
   - normalize。
   - validation。
   - diff。
   - commands。

2. `persistence`
   - IndexedDB repository。
   - settings repository。
   - export/import backup。
   - cloud repository interface。

3. `editor`
   - canvas state。
   - selection。
   - viewport。
   - command dispatch。

4. `features`
   - import。
   - export。
   - share。
   - versions。
   - settings。

5. `ui`
   - shell。
   - menu。
   - dialogs。
   - side panel。
   - reusable controls。

### 8.2 推荐文件结构

```text
src/
  domain/
    diagramModel.js
    diagramSchema.js
    normalizeDiagram.js
    validateDiagram.js
    diagramCommands.js
    diffDiagram.js
  persistence/
    localDiagramRepository.js
    settingsRepository.js
    backupRepository.js
    cloudRepository.js
  editor/
    EditorShell.jsx
    EditorProviders.jsx
    useDiagramStore.js
    useEditorCommands.js
    useEditorHotkeys.js
  features/
    import/
    export/
    share/
    versions/
    settings/
  components/
    EditorCanvas/
    EditorSidePanel/
    EditorHeader/
```

## 9. 研发路线图

### Phase 0：安全与工程底座

目标：先消除高风险和不可测状态。

任务：

1. 增加 `SECURITY.md` 和隐私说明。
2. 修复 localStorage parse 崩溃。（已完成：`settingsRepository` 会在 `localStorage.settings` 损坏时回退默认设置并清理损坏值。）
3. 导入文件增加大小和复杂度限制。（已完成：JSON/DDB/SQL/DBML 导入会先经过大小、文本长度、对象数量和字符串长度限制。）
4. 分享前增加数据外发确认。（已完成：首次创建分享链接前提示图表数据会上传到配置后端，未配置后端时不发起网络请求并显示配置提示。）
5. Docker nginx 增加安全 headers。
6. CI 增加 audit、测试、bundle budget。
7. 建立 Vitest 和 Playwright 基础。

验收：

- lint/build/test 全通过。
- `npm audit` 无 high/critical。
- 损坏 localStorage 不白屏。
- 未配置后端时分享有明确提示。

### Phase 1：Domain Model 与状态重构

目标：统一数据模型，为后续导入导出和撤销重做打基础。

任务：

1. 定义 normalized Diagram schema。（已完成 Phase 1.1 最小 domain shape。）
2. 增加 schemaVersion。（已完成 Phase 1.1。）
3. 编写 migrate/normalize。（已完成 Phase 1.2 纯函数入口，后续接入 repository/import service。）
4. ID 统一为 string。（已完成 Phase 1.1/1.2 domain 入口。）
5. 引入 command reducer。
6. Undo/redo 从 ControlPanel 移入 command history。
7. Workspace 拆出 loader/persistence hooks。

验收：

- 旧 IndexedDB 数据可迁移。
- 所有核心编辑动作可撤销/重做。
- ControlPanel 体积显著下降。

### Phase 2：导入导出可靠性

目标：将多数据库能力变成可回归测试的产品核心。

任务：

1. 为 JSON/DDB/DBML/SQL 建 fixture。
2. 为每个数据库建立 import/export golden tests。
3. SQL 导入增加预览和错误列表。
4. SQL 导出前接入 validation。
5. DBML 导出完善转义和 schemaVersion。
6. 修复全量本地导出 zip 的文件名和复用 zip 实例问题。

验收：

- 每个 dialect 至少 20 个 fixture。
- 复合外键可 round-trip。
- 导入失败不破坏当前图。

### Phase 3：编辑器体验重构

目标：提升首次使用、侧栏结构、菜单、快捷键和可访问性。

任务：

1. 新建向导。
2. 本地图表管理增强。
3. SidePanel 信息架构整理。
4. Header/Menu 配置化。
5. 所有 icon-only 按钮补 aria-label。
6. 快捷键帮助面板。
7. Issue panel 支持定位和过滤。

验收：

- 新用户能快速创建第一个 diagram。
- 无名按钮为 0。
- axe 无严重问题。
- 移动端 landing 无横向溢出。

### Phase 4：性能与包体治理

目标：让大图可用，让首屏更轻。

任务：

1. Monaco 动态加载。
2. SQL parser 按导入时动态加载。
3. 图片/PDF 导出库动态加载。
4. Landing 动画和 tweet 延迟加载。
5. 画布组件 memo 和选择器优化。
6. 大图 benchmark。
7. 评估视口裁剪或 SVG 分层。

验收：

- 主 chunk 显著下降。
- 100 表编辑流畅。
- 500 表可查看和搜索。

### Phase 5：可选云端和账号

目标：增加登录和云同步，但不破坏本地模式。

任务：

1. 定义 cloud repository interface。
2. 登录状态和 session 管理。
3. 云端 diagram list。
4. 本地到云端上传。
5. 权限模型。
6. 云端保存冲突处理。
7. 分享链接权限升级。

验收：

- 未登录可继续完整使用本地模式。
- 登录后可上传/同步图表。
- 权限不足进入只读。
- Token 过期不丢本地修改。

## 10. 测试策略

### 10.1 单元测试

覆盖：

- normalizeDiagram。
- validateDiagram。
- diagramCommands。
- undo/redo。
- diffDiagram。
- SQL/DBML import/export。
- settingsRepository。

### 10.2 集成测试

覆盖：

- 新建图。
- 本地保存和恢复。
- JSON 导入导出。
- SQL 导入导出。
- 分享后读取。
- 版本恢复。

### 10.3 E2E 测试

覆盖：

- 首次进入新建。
- 添加表和字段。
- 创建关系。
- 导入 SQL。
- 导出 SQL。
- 保存、刷新、恢复。
- 键盘快捷键。

### 10.4 性能测试

覆盖：

- 100 表图加载和拖拽。
- 500 表图打开和搜索。
- 1000 表图导出。
- 主包大小。
- 首屏加载时间。

### 10.5 安全测试

覆盖：

- 超大 JSON。
- 深层嵌套 JSON。
- 超长 SQL。
- 恶意 Markdown/HTML 注释。
- 非法分享 payload。
- 损坏 settings。

## 11. 验收指标

1. 稳定性
   - 无白屏启动错误。
   - 导入失败不丢当前图。
   - 自动保存失败可恢复。

2. 正确性
   - 核心 dialect fixtures 全通过。
   - 复合外键、索引、唯一约束可导入导出。

3. 安全
   - 无 high/critical audit。
   - 分享前明确确认。
   - 文件导入有大小和复杂度限制。

4. 性能
   - 主 chunk 降到可接受范围。
   - 大图基本可用。

5. 可访问性
   - 无名按钮为 0。
   - 键盘可完成主要操作。
   - axe 无严重问题。

6. 产品清晰度
   - 本地、分享、云端三种模式边界清楚。
   - 未配置后端时没有误导功能。

## 12. 不建议纳入首轮的范围

1. 实时多人协作。
2. 完整 SQL parser 自研。
3. 所有数据库 dialect 100% 语法覆盖。
4. 强制账号登录。
5. 把 drawDB 改成通用 BI 或数据库管理平台。
6. 生产数据库直连和执行 SQL。

## 13. 推进建议

建议先用 2 周完成 Phase 0 和 Phase 1 的最小闭环，再进入导入导出的测试矩阵。不要先做账号登录或云端协作，因为当前 domain model、撤销重做、导入导出和安全边界还不够稳，直接加云端会放大复杂度。

推荐拆分为以下里程碑：

1. M1：安全底座与测试框架。
2. M2：Domain model 和 command history。
3. M3：导入导出可靠性。
4. M4：编辑器体验和可访问性。
5. M5：性能治理。
6. M6：可选账号和云端同步。

每个里程碑都必须有可运行版本、测试报告和回滚路径。
