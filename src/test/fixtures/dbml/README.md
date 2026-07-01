# DBML fixtures

本目录用于保存 DBML 导入、导出和 roundtrip 回归样本。

命名规则：

- 输入 DBML：`dbml-<capability>.input.dbml`
- 期望 normalized diagram：`dbml-<capability>.expected.json`
- 导出 golden DBML：`dbml-<capability>.golden.dbml`
- issue 期望：`dbml-<capability>.issues.json`

首批能力点：

- `basic`：table、字段、primary key 和 ref。
- `enum`：DBML enum 到 Domain enum。
- `index`：单字段和多字段 indexes。
- `comment`：table note 和字段 note。
- `unsupported`：当前 DBML parser 可识别但 drawDB 暂不表达的属性。

测试要求：

- 导入测试优先断言 normalized diagram，而不是 UI 临时结构。
- 导出 golden 使用 LF 换行，并保留文件末尾换行。
- roundtrip 测试必须明确哪些属性允许规范化重排。
