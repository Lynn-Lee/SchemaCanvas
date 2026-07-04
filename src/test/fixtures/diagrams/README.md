# Diagram fixtures

本目录保存 SchemaCanvas normalized diagram、旧格式兼容样本和导出输入样本。

命名规则：

- normalized diagram：`diagram-<capability>.json`
- 旧格式输入：`legacy-<capability>.input.json`
- 期望 normalize 输出：`legacy-<capability>.expected.json`
- DDB 输入：`ddb-<capability>.input.ddb`
- DDB 期望输出：`ddb-<capability>.expected.json`

首批能力点：

- `basic-local-diagram`：本地无账号模式基础图表，已用于当前测试。
- `relationships`：单字段和复合关系。
- `types-enums`：自定义类型和枚举。
- `validation-issues`：用于覆盖 warning/error issue。
- `backup`：用于全量本地备份导出测试。

维护要求：

- JSON fixture 必须格式化为两个空格缩进，文件末尾保留换行。
- 新增旧格式 fixture 时，必须说明它来自哪个兼容入口：IndexedDB、JSON、DDB、template 或 share payload。
- 作为导出输入的 fixture 应避免包含随机 id 或时间戳，除非测试显式固定这些值。
