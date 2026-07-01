# SQL fixtures

本目录用于保存 SQL dialect 导入和导出回归样本。

命名规则：

- 输入 SQL：`<dialect>-<capability>.sql`
- 期望 normalized diagram：`<dialect>-<capability>.expected.json`
- 导出 golden SQL：`<dialect>-<capability>.golden.sql`
- issue 期望：`<dialect>-<capability>.issues.json`

`<dialect>` 取值：

- `mysql`
- `postgres`
- `sqlite`
- `mariadb`
- `mssql`
- `oracle`

首批能力点：

- `basic`：至少两张表、一个 primary key、一个 foreign key。
- `composite-foreign-key`：复合外键。
- `index`：普通索引和唯一索引。
- `default`：字面量和常见函数 default。
- `comment`：表和字段注释。
- `unsupported`：view、trigger、procedure 等暂不导入对象。

测试要求：

- 每个 SQL 输入都应有可读的 expected JSON 或明确的 issues JSON。
- 不支持语法不得静默通过；至少断言 warning/error 的 `messageKey`。
- 导出 golden 应固定换行、缩进、constraint 顺序和尾随换行。
