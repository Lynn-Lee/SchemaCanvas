# drawDB Phase 1 Domain模型与持久化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立稳定的 diagram domain model、归一化入口、结构化校验、command history 和本地持久化 repository，让后续导入导出、撤销重做、本地保存和可选云端能力共享同一数据契约。

**Architecture:** Phase 1 先新增纯函数 domain 层，不直接重写大型 React 组件；每个切片都通过 Vitest 保护现有 shape。随后以 adapter/repository 方式逐步替换 `Workspace.jsx` 中的 Dexie 读写和散落状态组装，保持本地无账号编辑、保存、刷新恢复可用。

**Tech Stack:** React 18、Vite 8、Dexie/IndexedDB、Vitest、Testing Library、Playwright、现有 `jsonschema` 依赖。

---

## 1. 当前代码入口

- `src/components/Workspace.jsx`：当前负责 route/template/share/loading/autosave/manual save，Phase 1 只逐步抽离，不做一次性大拆分。
- `src/context/DiagramContext.jsx`、`src/context/TypesContext.jsx`、`src/context/EnumsContext.jsx`、`src/context/UndoRedoContext.jsx`：当前 domain mutation 和 undo/redo 记录散落在 React context 中。
- `src/data/db.js`：当前 Dexie schema 和业务读写直接暴露给 UI。
- `src/utils/issues.js`：当前返回字符串数组，Phase 1 需要保留兼容 wrapper，同时新增结构化 issue engine。
- `src/test/fixtures/diagrams/basic-local-diagram.json`：可作为第一批 normalized fixture 的输入参考。

## 2. Phase 1 切片队列

### 1.1 Diagram Model 常量与工厂

状态：已完成，新增 `src/domain/diagramModel.js` 和 `src/domain/diagramModel.test.js`。红灯记录为缺失 `./diagramModel` 导致聚焦测试失败；补齐实现后聚焦测试和 lint 通过。

目标：定义 `CURRENT_SCHEMA_VERSION`、标准 diagram shape 和 table/field/relationship/note/area/type/enum 工厂，先不接入 UI。

修改文件：

- 新增 `src/domain/diagramModel.js`
- 新增 `src/domain/diagramModel.test.js`
- 修改本实施计划状态记录

测试内容：

```js
import { describe, expect, it } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  createDiagram,
  createField,
  createTable,
} from "./diagramModel";
import { DB } from "../data/constants";

describe("diagramModel", () => {
  it("creates a normalized local-first diagram with string ids", () => {
    const table = createTable({ id: 42, name: "users" });
    const diagram = createDiagram({
      diagramId: 7,
      database: DB.POSTGRES,
      name: "Auth",
      tables: [table],
    });

    expect(diagram.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(diagram.diagramId).toBe("7");
    expect(diagram.database).toBe(DB.POSTGRES);
    expect(diagram.tables[0].id).toBe("42");
    expect(diagram.tables[0].fields[0]).toMatchObject({
      name: "id",
      primary: true,
      notNull: true,
    });
    expect(diagram.relationships).toEqual([]);
  });

  it("normalizes field defaults without dropping database attributes", () => {
    expect(createField({ id: 10, name: "email", type: "VARCHAR" })).toMatchObject({
      id: "10",
      name: "email",
      type: "VARCHAR",
      default: "",
      check: "",
      primary: false,
      unique: false,
      notNull: false,
      increment: false,
      comment: "",
    });
  });
});
```

步骤：

- [ ] 写入上述红灯测试。
- [ ] 运行 `npm run test -- src/domain/diagramModel.test.js`，确认因 `diagramModel` 缺失失败。
- [ ] 新增 `src/domain/diagramModel.js`，导出 `CURRENT_SCHEMA_VERSION = 1`、`createField`、`createTable`、`createRelationship`、`createNote`、`createArea`、`createType`、`createEnum`、`createDiagram`。
- [ ] `createDiagram` 必须把旧字段 `references` 读成标准 `relationships`，并补齐 `notes`、`areas`、`types`、`enums`、`pan`、`zoom`、`gistId`、`loadedFromGistId`。
- [ ] 运行 `npm run test -- src/domain/diagramModel.test.js` 和 `npm run lint`，确认通过。

### 1.2 normalizeDiagram 与旧数据兼容

状态：已完成，新增 `src/domain/normalizeDiagram.js` 和 `src/domain/normalizeDiagram.test.js`。红灯记录为缺失 `./normalizeDiagram` 导致聚焦测试失败；补齐实现后聚焦测试、全量测试、lint、build、audit 均通过。

目标：把旧 IndexedDB、JSON、DDB、template、share payload 统一转换到 normalized diagram shape。

修改文件：

- 新增 `src/domain/normalizeDiagram.js`
- 新增 `src/domain/normalizeDiagram.test.js`
- 可选新增 `src/test/fixtures/diagrams/legacy-local-diagram.json`

测试内容：

```js
import { describe, expect, it } from "vitest";
import { normalizeDiagram } from "./normalizeDiagram";
import { CURRENT_SCHEMA_VERSION } from "./diagramModel";

describe("normalizeDiagram", () => {
  it("converts legacy references to relationships and string ids", () => {
    const result = normalizeDiagram({
      diagramId: 123,
      database: "postgres",
      name: "Legacy",
      tables: [{ id: 1, name: "users", fields: [{ id: 2, name: "id", primary: true }] }],
      references: [{ id: 3, startTableId: 1, endTableId: 1 }],
      pan: { x: 10, y: 20 },
      zoom: 0.8,
    });

    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.diagramId).toBe("123");
    expect(result.tables[0].id).toBe("1");
    expect(result.tables[0].fields[0].id).toBe("2");
    expect(result.relationships[0]).toMatchObject({
      id: "3",
      startTableId: "1",
      endTableId: "1",
    });
    expect(result.references).toBeUndefined();
  });
});
```

步骤：

- [x] 写入上述红灯测试。
- [x] 运行 `npm run test -- src/domain/normalizeDiagram.test.js`，确认因 `normalizeDiagram` 缺失失败。
- [x] 实现 `normalizeDiagram(input)`，内部调用 `createDiagram`；显式处理 `input.relationships ?? input.references ?? []`、所有实体 id string 化、缺失 `database` 回退 `DB.GENERIC`、缺失 `pan` 回退 `{ x: 0, y: 0 }`、缺失 `zoom` 回退 `1`。
- [x] 运行 `npm run test -- src/domain/normalizeDiagram.test.js src/domain/diagramModel.test.js` 和 `npm run lint`，确认通过。

### 1.3 Diagram Schema 运行时校验

状态：已完成，新增 `src/domain/diagramSchema.js` 和 `src/domain/diagramSchema.test.js`。红灯记录为缺失 `./diagramSchema` 导致聚焦测试失败；补齐实现后聚焦测试和 lint 通过。

目标：新增轻量 schema 校验，给 repository、import service 和未来 cloud adapter 复用。

修改文件：

- 新增 `src/domain/diagramSchema.js`
- 新增 `src/domain/diagramSchema.test.js`

步骤：

- [x] 写红灯测试，覆盖 normalized diagram 返回 `{ valid: true, errors: [] }`、缺少 `diagramId` 返回 `{ valid: false }`、`tables` 不是数组时返回错误路径 `tables`。
- [x] 运行 `npm run test -- src/domain/diagramSchema.test.js`，确认因 schema 模块缺失失败。
- [x] 实现 `validateDiagramShape(diagram)`，输出固定为 `{ valid: boolean, errors: [{ path, message }] }`；使用显式校验以保持 domain 层轻量。
- [x] 运行 `npm run test -- src/domain/diagramSchema.test.js` 和 `npm run lint`，确认通过。

### 1.4 结构化 validation issues

状态：已完成，新增 `src/domain/validateDiagram.js` 和 `src/domain/validateDiagram.test.js`，并把 `src/utils/issues.js` 改为兼容 wrapper。红灯记录为缺失 `./validateDiagram` 导致聚焦测试失败；补齐实现后聚焦测试通过。

目标：新增 `validateDiagram` 返回结构化 issue，同时保留 `src/utils/issues.js` 的字符串输出兼容旧 UI。

修改文件：

- 新增 `src/domain/validateDiagram.js`
- 新增 `src/domain/validateDiagram.test.js`
- 修改 `src/utils/issues.js`

结构化 issue 形状：

```js
{
  id: "duplicate-table-name:t2",
  severity: "error",
  objectType: "table",
  objectId: "t2",
  messageKey: "duplicate_table_by_name",
  message: "Duplicate table name: users",
  fixHint: "Rename one of the duplicate tables.",
}
```

步骤：

- [x] 写红灯测试，覆盖重复表名、空字段名、无主键三类 issue。
- [x] 运行 `npm run test -- src/domain/validateDiagram.test.js`，确认因模块缺失失败。
- [x] 实现 `validateDiagram(diagram)`，每个 issue 都包含 `id`、`severity`、`objectType`、`objectId`、`messageKey`、`message`、`fixHint`。
- [x] 修改 `src/utils/issues.js`，保留 `getIssues(diagram)` 导出，内部返回 `validateDiagram(diagram).map((issue) => issue.message)`。
- [x] 运行 `npm run test -- src/domain/validateDiagram.test.js`，确认通过；全量验证记录见本轮 run log。

### 1.5 Command reducer 与 command history

状态：已完成，新增 `src/domain/diagramCommands.js`、`src/domain/diagramHistory.js` 和对应聚焦测试。红灯记录为缺失 `./diagramCommands` / `./diagramHistory` 导致聚焦测试失败；补齐实现后聚焦测试和 lint 通过。

目标：以纯函数实现 diagram command reducer 和 undo/redo，不先替换 React context 的所有逻辑。

修改文件：

- 新增 `src/domain/diagramCommands.js`
- 新增 `src/domain/diagramHistory.js`
- 新增 `src/domain/diagramCommands.test.js`
- 新增 `src/domain/diagramHistory.test.js`

导出接口：

```js
export function applyCommand(diagram, command) {
  return { diagram: nextDiagram, inverseCommand, messageKey };
}

export function createHistoryState(diagram) {
  return { current: diagram, undoStack: [], redoStack: [] };
}

export function dispatchHistory(state, command) {
  return { current, undoStack, redoStack };
}
```

步骤：

- [x] 写红灯测试，覆盖 `table.create`、`field.update`、`relationship.delete`、`undo`、`redo`，并补充 `note`、`area`、`enum`、`type`、`viewport` 命令族回归。
- [x] 运行 `npm run test -- src/domain/diagramCommands.test.js src/domain/diagramHistory.test.js`，确认因模块缺失失败。
- [x] 实现 `applyCommand` 和 history helpers；所有返回 diagram 都必须保持 immutable update。
- [x] 运行 `npm run test -- src/domain/diagramCommands.test.js src/domain/diagramHistory.test.js` 和 `npm run lint`，确认通过。

### 1.6 localDiagramRepository

状态：已完成，新增 `src/persistence/localDiagramRepository.js` 和 `src/persistence/localDiagramRepository.test.js`。红灯记录为缺失 `./localDiagramRepository` 导致聚焦测试失败；补齐实现后聚焦测试通过。

目标：封装 Dexie CRUD，所有读写都 normalize，先提供给后续 `Workspace` 拆分使用。

修改文件：

- 新增 `src/persistence/localDiagramRepository.js`
- 新增 `src/persistence/localDiagramRepository.test.js`
- 必要时小幅修改 `src/data/db.js` 以便测试注入

导出接口：

```js
export function createLocalDiagramRepository(database = db) {
  return {
    listRecentDiagrams,
    getDiagramById,
    saveDiagram,
    deleteDiagram,
    duplicateDiagram,
  };
}
```

步骤：

- [x] 写红灯测试，覆盖 `listRecentDiagrams({ limit: 10 })` 按 `lastModified` 倒序返回 normalized summary、`getDiagramById` 找不到返回 `null`、`saveDiagram` 保存前 normalize。
- [x] 运行 `npm run test -- src/persistence/localDiagramRepository.test.js`，确认因 repository 缺失失败。
- [x] 实现 `createLocalDiagramRepository(database = db)`；所有返回 diagram 的方法都调用 `normalizeDiagram`；错误不在 repository 中吞掉。
- [x] 运行 `npm run test -- src/persistence/localDiagramRepository.test.js`、`npm run test` 和 `npm run lint`，确认通过。

### 1.7 useDiagramLoader 与 useDiagramPersistence 初步抽离

状态：已完成，新增 `src/editor/useDiagramLoader.js`、`src/editor/useDiagramPersistence.js` 和对应 hook 测试。红灯记录为缺失 hook 模块导致聚焦测试失败；补齐实现并接入 `Workspace.jsx` 后聚焦测试、全量测试和 lint 通过。

目标：把 `Workspace.jsx` 中的本地读取和保存组装抽到 hooks，但不同时重写 UI 布局。

修改文件：

- 新增 `src/editor/useDiagramLoader.js`
- 新增 `src/editor/useDiagramPersistence.js`
- 新增 `src/editor/useDiagramLoader.test.jsx`
- 新增 `src/editor/useDiagramPersistence.test.jsx`
- 修改 `src/components/Workspace.jsx`

步骤：

- [x] 写红灯测试，覆盖 loader 读取最近本地图后调用 state setters、找不到 route diagram 时触发恢复提示状态、persistence 保存新本地图后返回新 `diagramId` 并设置 saved state。
- [x] 运行 `npm run test -- src/editor/useDiagramLoader.test.jsx src/editor/useDiagramPersistence.test.jsx`，确认因 hooks 缺失失败。
- [x] 实现 hooks 并最小接入 `Workspace.jsx`；云端 `extensions.cloudSave` 和分享读取逻辑暂时保留原位。
- [x] 运行 `npm run test -- src/editor/useDiagramLoader.test.jsx src/editor/useDiagramPersistence.test.jsx`、`npm run test`、`npm run e2e`、`npm run lint`、`npm run build`，确认本地 editor smoke 仍通过。

## 3. Phase 1 退出门禁

Phase 1 所有切片完成后必须运行：

```bash
npm run lint
npm run test
npm run e2e
npm run build
git diff --check
npm audit --audit-level=high
```

退出标准：

- 旧本地图表可通过 `normalizeDiagram` 继续打开。
- Domain model 有 `schemaVersion`，并统一使用 string id。
- 结构化 validation issue 可供后续 Issues 面板迁移。
- Command history 的核心纯函数测试覆盖 table、field、relationship。
- `localDiagramRepository` 封装 Dexie CRUD，UI 不再直接拼装本地图表保存 payload。
- 本地无账号 editor 的创建、保存、刷新恢复 smoke 无回归。

## 4. 下一轮默认任务

下一轮自动化默认执行 Phase 1 退出门禁复核；若门禁保持通过，则生成 `docs/superpowers/plans/2026-07-01-drawDB-Phase-2-导入导出可靠性实施计划.md`，暂不直接进入 Phase 2 源码切片。
