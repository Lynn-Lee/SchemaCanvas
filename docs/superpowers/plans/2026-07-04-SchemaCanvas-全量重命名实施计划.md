# SchemaCanvas 全量重命名实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目品牌从 `drawDB` 全量迁移为 `SchemaCanvas`，并同步代码、文档、包名、外部链接、测试期望和仓库远端规则。

**Architecture:** 本计划只替换品牌标识，不改变产品功能、领域模型、路由语义、数据结构、云端接口或导入导出格式。实施时先建立品牌残留扫描和测试边界，再按元数据、运行时代码、文档文件、远端配置四个层次推进，避免把 `diagram`、`schema`、`database` 等业务术语误改。

**Tech Stack:** React、Vite、Vitest、Playwright、i18next、Dexie、Docker Compose、GitHub remote。

---

## 1. 命名决策

- 产品展示名统一为 `SchemaCanvas`。
- 技术 slug 统一为 `schemacanvas`。
- 官网统一为 `https://schemacanvas.app/`。
- GitHub 仓库 URL 统一为 `https://github.com/Lynn-Lee/schemacanvas`。
- 文档入口统一为 `https://schemacanvas.app/docs`。
- X 账号统一为 `https://x.com/schemacanvas`。
- bundle budget 环境变量前缀统一为 `SCHEMACANVAS_BUNDLE_*`。
- Docker service、container、image 示例统一使用 `schemacanvas`。

## 2. 实施边界

必须替换：

- `drawDB`、`DrawDB`、`drawdb` 作为品牌、包名、文档标题、页面标题、alt 文案、URL、镜像名、临时目录前缀或测试期望出现时全部替换。
- `drawdb.app` 替换为 `schemacanvas.app`。
- `drawdb-io/drawdb` 或 `github.com/drawdb-io/drawdb` 替换为 `Lynn-Lee/schemacanvas`。
- `DRAWDB_BUNDLE_MAX_JS_KB`、`DRAWDB_BUNDLE_MAX_CSS_KB`、`DRAWDB_BUNDLE_MAX_TOTAL_KB` 替换为对应 `SCHEMACANVAS_*`。

不得替换：

- `diagram`、`diagramId`、`CloudDiagrams`、`localDiagramRepository`、`schemaVersion`、`database`、`ERD` 等领域术语。
- IndexedDB store、云端 repository 方法、导入导出 JSON 字段名、测试 fixture 的 domain shape。
- 任何真实密钥、token、用户数据或未确认的外部凭据。

## 3. Task 1: 品牌残留测试和清单边界

**Files:**
- Modify: `src/build/pageI18nBoundary.test.js`
- Modify: `src/build/bundleBudget.test.js`
- Modify: `scripts/check-bundle-budget.mjs`

- [ ] **Step 1: 记录当前旧品牌分布**

Run:

```bash
rg -n "drawDB|DrawDB|drawdb|drawdb-io|drawdb\\.app|drawDB_" . \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!coverage/**' \
  --glob '!test-results/**' \
  --glob '!playwright-report/**'
```

Expected: 输出旧品牌命中，用于确认改名范围；不要把 `diagram` 相关业务术语加入替换清单。

- [ ] **Step 2: 先改测试期望为新品牌并确认红灯**

把品牌边界相关测试期望改为：

```js
expect(result.stdout).toContain("SchemaCanvas bundle budget summary");
expect(result.stderr).toContain("SCHEMACANVAS_BUNDLE_MAX_JS_KB");
```

页面/i18n 测试中涉及文档标题或可见品牌时统一断言 `SchemaCanvas`。

Run:

```bash
npm run test -- src/build/bundleBudget.test.js src/build/pageI18nBoundary.test.js
```

Expected: 至少因实现仍输出旧 `drawDB` 或仍读取 `DRAWDB_*` 环境变量而失败。

## 4. Task 2: 应用元数据、包名和运行时文案

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `index.html`
- Modify: `compose.yml`
- Modify: `scripts/check-bundle-budget.mjs`
- Modify: `src/data/socials.js`
- Modify: `src/data/surveyQuestions.js`
- Modify: `src/api/gists.js`
- Modify: `src/persistence/cloudRepository.js`
- Modify: `src/features/cloud/uploadLocalDiagram.js`
- Modify: `src/utils/exportSavedData.js`
- Modify: `src/i18n/locales/en.js`
- Modify: `src/i18n/locales/zh.js`

- [ ] **Step 1: 替换 package 和 compose 技术标识**

Use exact values:

```json
{
  "name": "schemacanvas"
}
```

Compose service and container:

```yaml
services:
  schemacanvas:
    image: node:20-alpine
    container_name: schemacanvas
```

- [ ] **Step 2: 替换 SEO、OpenGraph 和页面标题**

Use exact public values:

```html
<meta property="og:url" content="https://schemacanvas.app/" />
<meta property="og:title" content="SchemaCanvas | Online database diagram editor and SQL generator" />
<meta property="og:image" content="https://schemacanvas.app/hero_ss.png" />
<title>SchemaCanvas | Online database diagram editor and SQL generator</title>
```

Twitter image URLs also use `https://schemacanvas.app/hero_ss.png`。

- [ ] **Step 3: 替换社交与外部链接**

Use exact values:

```js
export const socials = {
  docs: "https://schemacanvas.app/docs",
  discord: "https://discord.gg/BrjZgNrmR6",
  twitter: "https://x.com/schemacanvas",
  github: "https://github.com/Lynn-Lee/schemacanvas",
  sponsor: "https://github.com/sponsors/1ilit",
};
```

Landing GitHub stars 请求从旧组织切到：

```js
axios.get("https://api.github-star-counter.workers.dev/user/Lynn-Lee")
```

- [ ] **Step 4: 替换运行时用户文案**

Use exact product wording:

```js
cloud_status_unavailable_description:
  "Cloud features are not configured for this SchemaCanvas instance.",
cloud_diagrams_document_title: "Cloud diagrams | SchemaCanvas",
cloud_diagrams_unavailable_description:
  "Cloud diagram storage is not configured for this SchemaCanvas instance.",
landing_document_title:
  "SchemaCanvas | Online database diagram editor and SQL generator",
landing_screenshot_alt: "SchemaCanvas editor showing a database diagram",
landing_features_title: "What SchemaCanvas has to offer",
bug_report_document_title: "Report a bug | SchemaCanvas",
templates_document_title: "Templates | SchemaCanvas",
```

中文对应改为：

```js
cloud_status_unavailable_description:
  "当前 SchemaCanvas 实例尚未配置云端能力。",
cloud_diagrams_document_title: "云端图表 | SchemaCanvas",
cloud_diagrams_unavailable_description:
  "当前 SchemaCanvas 实例尚未配置云端图表存储。",
landing_document_title: "SchemaCanvas | 在线数据库图表编辑器与 SQL 生成器",
landing_screenshot_alt: "显示数据库图表的 SchemaCanvas 编辑器",
landing_features_title: "SchemaCanvas 能提供什么",
bug_report_document_title: "报告问题 | SchemaCanvas",
templates_document_title: "模板 | SchemaCanvas",
```

- [ ] **Step 5: 替换 API 描述、默认错误和备份文件名**

Use exact values:

```js
const description = "SchemaCanvas diagram";
message: "Cloud features are not configured for this SchemaCanvas instance.";
message: "Cloud upload is not configured for this SchemaCanvas instance.";
saveAs(content, `schemacanvas-backup-${formatBackupTimestamp(now())}.zip`);
```

- [ ] **Step 6: 替换 bundle budget env 前缀**

Use exact constants and output:

```js
const maxJsKb = parseBudget("SCHEMACANVAS_BUNDLE_MAX_JS_KB", DEFAULT_MAX_JS_KB);
const maxCssKb = parseBudget("SCHEMACANVAS_BUNDLE_MAX_CSS_KB", DEFAULT_MAX_CSS_KB);
const maxTotalKb = parseBudget("SCHEMACANVAS_BUNDLE_MAX_TOTAL_KB", DEFAULT_MAX_TOTAL_KB);

console.log("SchemaCanvas bundle budget summary");
```

Run:

```bash
npm run test -- src/build/bundleBudget.test.js src/build/pageI18nBoundary.test.js
```

Expected: PASS。

## 5. Task 3: 文档、README、文件名和资产引用

**Files:**
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `CONTRIBUTING.md`
- Modify: `docs/engineering/导入导出支持范围.md`
- Modify: `docs/engineering/验证矩阵.md`
- Rename: `docs/drawDB-重构优化产品研发方案.md`
- Rename: `docs/superpowers/plans/*drawDB*.md`
- Rename: `drawdb.png`

- [ ] **Step 1: 用 git mv 改文档文件名和截图文件名**

Run:

```bash
git mv docs/drawDB-重构优化产品研发方案.md docs/SchemaCanvas-重构优化产品研发方案.md
git mv drawdb.png schemacanvas.png
```

For each plan filename under `docs/superpowers/plans/` containing `drawDB`, rename it to contain `SchemaCanvas` while preserving date and phase wording.

- [ ] **Step 2: 更新 README 公开说明和命令**

Use exact public commands:

```bash
git clone https://github.com/Lynn-Lee/schemacanvas.git
cd schemacanvas
npm install
npm run dev
```

Docker example:

```bash
docker build -t schemacanvas .
docker run -p 3000:80 schemacanvas
```

README logo/title and screenshot alt use `SchemaCanvas` and `schemacanvas.png`。

- [ ] **Step 3: 更新项目文档正文**

In docs, replace brand references with `SchemaCanvas` and repository references with:

```text
origin = https://github.com/Lynn-Lee/schemacanvas.git
```

Keep historical phase dates and implementation records intact. If a sentence specifically says “旧项目名 drawDB”, rewrite it as “原 drawDB 基线” only when historical context is necessary.

- [ ] **Step 4: 更新验证矩阵中的命令示例**

Use exact Docker tags:

```bash
docker build -t schemacanvas-phase0-smoke .
docker build -t schemacanvas-phase6-security-headers .
```

Run:

```bash
rg -n "drawDB|DrawDB|drawdb|drawdb-io|drawdb\\.app|drawDB_" README.md SECURITY.md CONTRIBUTING.md docs
```

Expected: no output, except intentionally documented historical migration wording if the line explicitly says `原 drawDB 基线`。

## 6. Task 4: 页面、E2E、fixtures 和本地规则

**Files:**
- Modify: `src/pages/LandingPage.jsx`
- Modify: `src/pages/Templates.jsx`
- Modify: `src/pages/CloudDiagrams.jsx`
- Modify: `src/pages/BugReport.jsx`
- Modify: `src/pages/NotFound.jsx`
- Modify: `src/test/e2e/app.smoke.spec.js`
- Modify: `src/test/e2e/support/localDiagramSeed.js`
- Modify: `src/features/import/importDiagramService.test.js`
- Modify: `src/test/fixtures/dbml/README.md`
- Modify: `src/test/fixtures/diagrams/README.md`
- Modify local-only `AGENTS.md` if present

- [ ] **Step 1: 更新页面中的硬编码 URL 和品牌联动**

Replace Warp sponsorship link:

```jsx
href="https://warp.dev/schemacanvas"
```

If tests expect page titles, use `SchemaCanvas` titles from i18n.

- [ ] **Step 2: 更新测试数据中作为品牌使用的旧名称**

Only replace old brand references. Do not replace `diagram` variable names or fixture schema keys.

Examples:

```js
const projectDir = await mkdtemp(path.join(tmpdir(), "schemacanvas-bundle-budget-"));
```

If e2e local seed describes app name, use `SchemaCanvas`。

- [ ] **Step 3: 更新本地规则文件**

If local `AGENTS.md` exists, update project identity and remote policy to `SchemaCanvas` and `https://github.com/Lynn-Lee/schemacanvas.git`。Keep the file local-only if it is currently ignored or untracked.

- [ ] **Step 4: Run focused checks**

Run:

```bash
npm run test -- src/build/bundleBudget.test.js src/build/pageI18nBoundary.test.js src/features/import/importDiagramService.test.js
npm run e2e -- src/test/e2e/app.smoke.spec.js
```

Expected: PASS。

## 7. Task 5: 远端迁移、全量验证和收口

**Files:**
- Git remote configuration
- Any file still reported by old-brand scan

- [ ] **Step 1: 确认外部仓库已准备好**

Before changing `origin`, verify the new remote exists:

```bash
git ls-remote https://github.com/Lynn-Lee/schemacanvas.git refs/heads/main
```

Expected: command exits 0 and prints a `refs/heads/main` SHA. If it fails, stop and report blocker: GitHub repository rename or creation has not been completed.

- [ ] **Step 2: Update remote**

Run:

```bash
git remote set-url origin https://github.com/Lynn-Lee/schemacanvas.git
git remote -v
```

Expected:

```text
origin  https://github.com/Lynn-Lee/schemacanvas.git (fetch)
origin  https://github.com/Lynn-Lee/schemacanvas.git (push)
```

- [ ] **Step 3: Run old-brand residual scan**

Run:

```bash
rg -n "drawDB|DrawDB|drawdb|drawdb-io|drawdb\\.app|drawDB_" . \
  --glob '!node_modules/**' \
  --glob '!dist/**' \
  --glob '!coverage/**' \
  --glob '!test-results/**' \
  --glob '!playwright-report/**'
```

Expected: no output, except lines explicitly documenting `原 drawDB 基线` as historical context.

- [ ] **Step 4: Run full verification gate**

Run:

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

Expected: all commands exit 0. Existing documented warnings, if any, must remain no worse than before.

- [ ] **Step 5: Commit and push**

Run:

```bash
git status --short --branch
git add package.json package-lock.json index.html compose.yml README.md SECURITY.md CONTRIBUTING.md docs scripts src schemacanvas.png
git status --short
git commit -m "chore: rename project to SchemaCanvas"
git push origin main
```

Expected: commit succeeds and push updates `origin/main`。

- [ ] **Step 6: Verify SHA convergence**

Run:

```bash
git rev-parse HEAD origin/main
git ls-remote origin refs/heads/main
```

Expected: local `HEAD`、local `origin/main`、remote `refs/heads/main` all match。

## 8. Completion Criteria

- No unintended `drawDB` / `DrawDB` / `drawdb` brand residue remains.
- User-visible app, docs, package metadata, README examples, Docker examples, social links and SEO metadata all show `SchemaCanvas`。
- `diagram` domain naming remains intact.
- Full verification gate passes.
- `origin` points to `https://github.com/Lynn-Lee/schemacanvas.git` after the GitHub repository has been renamed or created.
- `main` is pushed and SHA convergence is verified.
