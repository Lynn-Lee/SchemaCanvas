# 导入导出 fixture 说明

本目录记录 Phase 2 跨格式 fixture 的共享规则。具体 SQL、DBML 和 diagram 样本分别放在相邻的 `sql/`、`dbml/`、`diagrams/` 目录。

命名规则：

- 输入文件：`<format>-<capability>.input.<ext>`
- 期望 normalized diagram：`<format>-<capability>.expected.json`
- 导出 golden：`<format>-<capability>.golden.<ext>`
- issue 期望：`<format>-<capability>.issues.json`

能力名使用 kebab-case，例如 `basic`、`primary-key`、`composite-foreign-key`、`unsupported`、`roundtrip`。

约定：

- fixture 必须服务于一个明确能力点，不把多个无关场景塞进同一个文件。
- expected JSON 应尽量使用 normalized diagram shape，避免测试依赖旧 UI state 结构。
- golden 文本统一使用 LF 换行，并保留文件末尾换行。
- unsupported fixture 必须配套 `.issues.json`，说明期望 warning 或 error。
