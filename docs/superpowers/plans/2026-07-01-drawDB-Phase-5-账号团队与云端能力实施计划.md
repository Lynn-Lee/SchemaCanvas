# drawDB Phase 5 账号团队与云端能力实施计划

版本：2026-07-02

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 1. 阶段目标

Phase 5 的目标是在不破坏“无需账号、本地优先”核心体验的前提下，增加可选账号、团队和云端同步能力。本阶段所有能力必须被 capability 明确开关控制：未配置云端或用户未登录时，`/editor` 本地创建、保存、刷新恢复、导入、导出、分享不可用提示必须继续完整可用。

本阶段结束后，应满足：

- 云端能力有清晰 repository interface 和 no-backend adapter。
- 未配置云端时 UI 显示明确 unavailable 状态，不展示误导性的登录或团队入口。
- 登录、session 过期、权限不足和云端保存失败都有可恢复状态。
- 本地图表可以显式上传到云端，不自动外发。
- 云端图表列表支持我的图表、团队过滤和基础权限展示。
- 本地与云端 modified timestamp 冲突时必须确认，不静默覆盖。
- viewer 权限进入只读 editor。

## 2. 当前代码入口

- `src/context/ExtensionsContext.jsx`：当前扩展、云端和配置状态入口。
- `src/editor/useDiagramLoader.js`：本地 latest/by-id 加载入口，Phase 5 接入 cloud diagram load。
- `src/editor/useDiagramPersistence.js`：本地保存入口，Phase 5 接入 cloud save 和冲突检测。
- `src/persistence/localDiagramRepository.js`：本地 repository 参考实现。
- `src/components/Workspace.jsx`：editor shell 和本地加载/保存状态汇合点。
- `src/components/EditorHeader/ControlPanel.jsx`：Header 菜单、分享、打开和后续账号入口位置。
- `src/features/share/`：分享外发确认与后端配置边界参考。
- `src/pages/Editor.jsx`、`src/App.jsx`：路由和 editor providers 入口。
- `docs/engineering/验证矩阵.md`：Phase 5 每个切片必须同步验证记录。

## 3. 执行约束

- 每轮自动化最多做一个最小切片，不跨任务。
- 涉及代码行为必须 TDD：先写或更新失败测试，确认红灯，再实现，再跑聚焦和全量验证。
- 云端能力必须默认关闭；无后端、未登录、token 过期都不能阻塞本地模式。
- 任何会上传 diagram 内容的动作必须由用户显式触发，并在 UI 或确认文案中说明数据会发送到配置后端。
- token、session 和权限错误不能写入图表内容日志。
- Phase 5 不做实时多人协作、评论系统、生产数据库直连或强制登录。

## 4. Phase 5 切片队列

### 5.1 cloudRepository interface 与 no-backend adapter

状态：已完成（2026-07-02）。

目标：先定义云端能力的最小 contract，并提供未配置后端时稳定返回 unavailable 的 adapter。

修改文件：

- 新增 `src/persistence/cloudRepository.js`
- 新增 `src/persistence/cloudRepository.test.js`
- 修改 `docs/engineering/验证矩阵.md`
- 修改本文

步骤：

- [x] 写红灯测试，覆盖 no-backend adapter 的 `getSession`、`listCloudDiagrams`、`saveCloudDiagram` 返回 `{ ok: false, reason: "unavailable" }` 或等价结构化结果。
- [x] 定义 cloud repository interface：`getSession`、`login`、`logout`、`listCloudDiagrams`、`getCloudDiagram`、`saveCloudDiagram`、`deleteCloudDiagram`、`shareCloudDiagram`、`listTeams`、`getPermissions`。
- [x] no-backend adapter 不发起网络请求，不读取不存在的 token，不抛出未捕获异常。
- [x] 运行聚焦测试、`npm run test`、`npm run lint`、`npm run build`、`git diff --check`、`npm audit --audit-level=high`。

完成标准：

- 未配置云端时 repository 层有明确 unavailable 结果。
- 后续 UI 可以基于统一 reason 展示不可用状态。
- 本地 repository 和本地 editor 流程无行为变化。

### 5.2 cloud capability 配置与账号入口显隐

状态：已完成（2026-07-02）。

目标：仅在 cloud capability 配置可用时展示账号入口；未配置时不误导用户登录。

修改文件：

- 修改 `src/context/ExtensionsContext.jsx`
- 修改 `src/components/EditorHeader/ControlPanel.jsx`
- 新增或修改 Header/菜单测试

步骤：

- [x] 写红灯测试，覆盖未配置云端时 Header 不显示账号入口，配置云端时显示入口。（Phase 5.2 已完成，`CloudAccountEntry.test.jsx` 先确认 Header 账号入口组件缺失后红灯。）
- [x] 增加 cloud capability 读取和稳定默认值。（Phase 5.2 已完成，`getCloudCapability` 默认返回 unavailable，仅显式 `cloudCapability.enabled` 或 cloud backend/api/base URL 配置后启用。）
- [x] Header 中的账号入口只负责打开账号状态 UI，不自动登录或上传。（Phase 5.2 已完成，点击只调用可选 `openCloudAccount`，不会调用 login 或 saveCloudDiagram。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。（Phase 5.2 已完成并记录到 run log。）

完成标准：

- 未配置云端时本地模式 UI 不出现误导性账号入口。（Phase 5.2 已完成。）
- 配置云端时入口可见但不会阻塞 editor。（Phase 5.2 已完成，入口本身无登录、上传或 editor 阻塞副作用。）

### 5.3 signed-out、signed-in、expired-session、unavailable 状态 UI

状态：已完成（2026-07-02）。

目标：为账号状态建立可测试的展示组件，明确区分未登录、已登录、session 过期和云端不可用。

修改文件：

- 新增 `src/features/cloud/CloudAccountStatus.jsx`
- 新增或修改 `src/features/cloud/CloudAccountStatus.test.jsx`
- 修改 Header 入口承载弹窗或侧页

步骤：

- [x] 写红灯测试，覆盖四种状态文案、主要 action 和本地模式提示。（Phase 5.3 已完成，红灯记录为缺失 `CloudAccountStatus` 组件导致聚焦测试失败。）
- [x] 实现账号状态 UI，不在 unavailable 时暴露登录表单。（Phase 5.3 已完成，`CloudAccountStatus` 覆盖 unavailable、signed-out、signed-in、expired-session。）
- [x] expired-session 状态必须提示本地未保存更改仍保留。（Phase 5.3 已完成。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。（Phase 5.3 已完成并记录到 run log。）

完成标准：

- 用户能理解当前云端能力是否可用。（Phase 5.3 已完成。）
- 未登录和 token 过期都不会影响本地编辑。（Phase 5.3 已完成，状态 UI 明确提示本地模式继续可用。）

### 5.4 云端图表列表与团队过滤骨架

状态：已完成（2026-07-02）。

目标：新增云端图表列表页面或弹窗骨架，支持我的图表、团队过滤和 unavailable 空状态。

修改文件：

- 新增 `src/pages/CloudDiagrams.jsx`
- 修改 `src/App.jsx`
- 新增或修改 cloud diagram list 测试

步骤：

- [x] 写红灯测试，覆盖 unavailable、empty、mine、team filtered 四种列表状态。（Phase 5.4 已完成，红灯先确认为缺失 `CloudDiagrams` 页面。）
- [x] 接入 cloud repository list 方法，保留 loading/error/empty 状态。（Phase 5.4 已完成，默认 no-backend adapter 返回 unavailable，配置 repository 后显示列表。）
- [x] 团队过滤只基于 repository 返回团队列表，不写死团队。（Phase 5.4 已完成，filter option 由 `listTeams` 结果生成。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。（Phase 5.4 已完成并记录到 run log。）

完成标准：

- 未配置云端时列表页面可解释不可用，不崩溃。（Phase 5.4 已完成。）
- 已配置 mock repository 时能展示图表、权限和团队过滤。（Phase 5.4 已完成。）

### 5.5 上传当前本地图到云端

状态：已完成（2026-07-02）。

目标：用户显式触发后，把当前 normalized diagram 上传到云端，并保留本地副本。

修改文件：

- 修改 `src/editor/useDiagramPersistence.js`
- 新增 `src/features/cloud/uploadLocalDiagram.js`
- 新增或修改 cloud upload 测试

步骤：

- [x] 写红灯测试，覆盖上传前需要用户动作、上传使用 normalized diagram、失败不清空本地保存状态。（Phase 5.5 已完成，红灯先确认为缺失 `uploadLocalDiagram` helper 和 `CloudUploadLocalDiagram` 组件。）
- [x] 实现上传 helper，返回 cloud diagram id、modified timestamp 和权限。（Phase 5.5 已完成，`uploadLocalDiagram` normalize 后调用 `saveCloudDiagram`，并标准化成功/失败结果。）
- [x] UI 必须说明会把图表数据发送到配置后端。（Phase 5.5 已完成，Header 上传按钮先打开确认弹窗，确认文案说明图表数据会发送到配置云端后端，失败提示本地副本仍保留。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。（Phase 5.5 已完成并记录到 run log。）

完成标准：

- 本地图表不会自动上传。（Phase 5.5 已完成。）
- 上传失败不丢本地数据，成功后显示云端保存来源。（Phase 5.5 已完成，成功后 Header 显示上传成功状态，失败时保留本地副本提示。）

### 5.6 云端加载与本地模式不阻塞

状态：已完成。

目标：通过 route 或显式打开加载云端图表，但未登录、不可用或权限不足时不阻塞 `/editor` 本地模式。

修改文件：

- 修改 `src/editor/useDiagramLoader.js`
- 修改 `src/components/Workspace.jsx`
- 新增 loader 测试和 e2e smoke

步骤：

- [x] 写红灯测试，覆盖 cloud diagram load 成功、unavailable、unauthorized 和 fallback local new diagram。（Phase 5.6 已完成，红灯先确认为 `loadCloudDiagramById` 缺失。）
- [x] 接入 cloud repository `getCloudDiagram`，成功后 normalize，再进入 editor state。（Phase 5.6 已完成，`/editor?cloudDiagramId=...` 作为显式打开入口。）
- [x] 权限不足时给出只读或错误状态，不覆盖当前本地草稿。（Phase 5.6 已完成，unavailable/unauthorized/error 只设置加载失败和本地新建入口，不写入 diagram state。）
- [x] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。（Phase 5.6 已完成并记录到 run log。）

完成标准：

- `/editor` 默认本地模式不需要登录。（Phase 5.6 已完成。）
- cloud route 或显式打开失败时不会清空本地数据。（Phase 5.6 已完成，新增 Playwright smoke 覆盖 fallback local editor mode。）

### 5.7 云端保存、冲突检测与 token 过期恢复

状态：未开始。

目标：云端保存必须处理本地/云端 modified timestamp 冲突和 session 过期，不静默覆盖、不丢未保存更改。

修改文件：

- 修改 `src/editor/useDiagramPersistence.js`
- 新增 `src/features/cloud/CloudConflictDialog.jsx`
- 新增 persistence/cloud conflict 测试

步骤：

- [ ] 写红灯测试，覆盖 remote modified newer 时返回 conflict，token expired 时返回 auth-expired 且保留 pending local changes。
- [ ] 实现冲突弹窗，提供保留本地、覆盖云端、另存为本地图三条路径。
- [ ] 保存失败时 Header 保存状态进入 Error，并保留 retry action。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`。

完成标准：

- 冲突不静默覆盖。
- token 过期不丢本地未保存更改。

### 5.8 权限模型与 viewer 只读 editor

状态：未开始。

目标：支持 owner、editor、viewer 权限，并把 viewer 映射到只读 editor。

修改文件：

- 新增 `src/features/cloud/cloudPermissions.js`
- 修改 `src/components/Workspace.jsx`
- 修改 canvas/header/side panel action disabled 状态
- 新增权限测试和 e2e smoke

步骤：

- [ ] 写红灯测试，覆盖 owner/editor 可编辑，viewer 禁用保存、编辑、导入和 destructive actions。
- [ ] 增加统一 permission helper，避免权限判断散落在 UI。
- [ ] viewer 模式显示只读提示，但允许导出允许范围内的数据。
- [ ] 运行聚焦测试、`npm run test`、`npm run e2e`、`npm run accessibility`、`npm run lint`、`npm run build`。

完成标准：

- viewer 无法修改 diagram。
- owner/editor 仍保留本地和云端保存路径。
- 只读提示可被键盘和屏幕阅读器访问。

## 5. Phase 5 退出门禁

Phase 5 所有切片完成后必须运行：

```bash
npm run lint
npm run test
npm run e2e
npm run accessibility
npm run build
git diff --check
npm audit --audit-level=high
```

涉及 bundle 或依赖变化的切片额外运行：

```bash
npm run bundle:check
```

退出标准：

- 未配置云端时 UI 明确说明不可用，本地 editor 不受影响。
- 未登录用户仍可完整使用本地模式。
- 登录后可显式上传和打开云端图表。
- session 过期不丢本地未保存更改。
- viewer 权限强制只读。
- 本地/云端冲突必须确认后处理。

## 6. 下一轮默认任务

下一轮自动化默认执行 Phase 5.6 云端加载与本地模式不阻塞。
