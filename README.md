<div align="center">
  <img width="64" alt="SchemaCanvas logo" src="./src/assets/icon-dark.png">
  <h1>SchemaCanvas</h1>
</div>

<h3 align="center">隐私优先、无需账号、可离线使用的数据库结构设计与 SQL 生成工具。</h3>

<p align="center">
  <img width="760" style="border-radius:5px;" alt="SchemaCanvas 产品截图" src="schemacanvas.png">
</p>

SchemaCanvas 是一个运行在浏览器中的数据库结构设计器。你可以在可视化画布上设计表、字段、关系、分组区域和备注，并将模型导出为 SQL、DBML、JSON、Markdown、Mermaid 或图片/PDF 等格式。核心编辑、保存和导出能力默认在本地完成，不需要注册账号，也不依赖云端服务。

## 项目来源与致谢

SchemaCanvas 是基于 [drawDB](https://github.com/drawdb-io/drawdb) 开源项目优化重构后的项目。我们在原项目优秀的浏览器端数据库建模体验基础上，围绕隐私优先的本地使用模式、默认中文界面、SchemaCanvas 品牌化、多数据库类型建模、SQL / DBML / JSON / DDB 导入导出、Markdown / Mermaid / 图片 / PDF 导出、模型校验、自定义类型与枚举、可选分享与云端能力边界，以及 Vitest / Playwright / accessibility / build / bundle / audit 等验证门禁做了系统整理和增强。感谢 drawDB 原项目作者与贡献者提供的开源基础，SchemaCanvas 的持续演进建立在这份开放工作的价值之上。

## 核心功能

- **可视化建模**：在画布中创建和编辑数据表、字段、主键、唯一约束、索引、关系、区域和备注。
- **多数据库支持**：支持 MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle SQL beta 和 Generic 通用模型。
- **SQL 生成**：根据当前图表生成对应数据库方言的建表 SQL。
- **SQL 反向导入**：从 SQL 文本或 `.sql` 文件解析表、字段、索引和外键关系，生成可编辑图表。
- **DBML / JSON 导入导出**：支持 DBML、JSON、DDB 等结构化图表数据的导入和导出。
- **图像与文档导出**：支持导出 PNG、JPEG、SVG、PDF、Markdown 文档和 Mermaid ER 图。
- **本地持久化**：图表默认保存到浏览器 IndexedDB，支持打开最近图表、另存为、删除和导出本地保存数据。
- **模板能力**：内置示例模板，也可以把当前图表保存为自定义模板复用。
- **编辑效率工具**：支持撤销/重做、复制/粘贴、复制为图片、快捷键、缩放、网格、吸附、演示模式和全屏。
- **模型校验**：编辑和导入时会检查图表结构问题，例如重复命名、缺失引用、关系字段不存在等。
- **自定义类型与枚举**：PostgreSQL 和 Generic 模型支持自定义类型；PostgreSQL 支持枚举和数组类型。
- **可选分享与云端能力**：配置兼容后端后，可启用分享链接、版本记录、云端图表和云端账号入口；未配置时核心本地模式照常可用。

## 隐私与数据边界

SchemaCanvas 的默认模式是本地优先：

- 不登录也可以创建、编辑、保存和导出图表。
- 图表数据默认保存在浏览器 IndexedDB 中。
- 导入的 SQL、DBML、JSON 和图表文件会在前端解析和校验。
- 只有用户主动使用分享或云端能力，并且实例已配置后端服务时，图表数据才会发送到网络服务。

## 支持格式

| 类型 | 支持内容 |
| --- | --- |
| 导入 | SQL、DBML、JSON、DDB |
| SQL 导出 | MySQL、PostgreSQL、SQLite、MariaDB、MSSQL、Oracle SQL beta |
| 结构导出 | DBML、JSON、本地保存数据 |
| 文档导出 | Markdown、Mermaid |
| 图像导出 | PNG、JPEG、SVG、PDF |

## 技术栈

- React 18
- Vite
- Semi Design
- Tailwind CSS
- Dexie / IndexedDB
- i18next
- Monaco Editor
- Vitest
- Playwright
- Docker / Nginx

## 本地开发

环境要求：

- Node.js 20 或更高版本
- npm

安装依赖并启动开发服务：

```bash
npm install
npm run dev
```

默认开发地址由 Vite 输出，通常是：

```text
http://localhost:5173
```

## 常用命令

```bash
# 启动开发服务
npm run dev

# 生产构建
npm run build

# 本地预览构建产物
npm run preview

# 运行单元测试
npm run test

# 监听模式运行测试
npm run test:watch

# 测试覆盖率
npm run coverage

# 运行端到端测试
npm run e2e

# 运行可访问性测试
npm run accessibility

# ESLint 检查
npm run lint

# 包体预算检查
npm run bundle:check
```

## Docker 运行

使用 Docker 构建生产镜像：

```bash
docker build -t schemacanvas .
docker run --rm -p 3000:80 schemacanvas
```

访问：

```text
http://localhost:3000
```

也可以使用仓库内的 `compose.yml` 启动开发服务：

```bash
docker compose up
```

## 可选后端配置

SchemaCanvas 不依赖后端即可使用本地编辑器。若需要启用分享、版本记录或云端图表能力，可以在环境变量中配置兼容后端地址：

```bash
VITE_BACKEND_URL=https://your-backend.example.com
```

本地可参考 `.env.sample`：

```bash
cp .env.sample .env
```

未配置 `VITE_BACKEND_URL` 时，分享和云端接口会保持不可用状态，本地编辑、保存、导入和导出功能不受影响。

## 项目结构

```text
src/
  components/        通用组件与编辑器 UI
  context/           编辑器状态上下文
  data/              数据库类型、种子模板和 IndexedDB 定义
  domain/            图表模型、命令、历史和校验逻辑
  editor/            编辑器快捷键、菜单和加载/保存流程
  features/          导入、导出、分享、云端、本地图表等功能模块
  i18n/              多语言资源
  pages/             路由页面
  utils/             SQL、DBML、Mermaid、文档和导入导出工具
```

## 贡献

贡献前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全相关问题请参考 [SECURITY.md](SECURITY.md)。

## 许可证

本项目使用 [GNU Affero General Public License v3.0](LICENSE)。
