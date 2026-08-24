# Figma 下载工具开发规范与指南 (DEV.md)

本项目用于自动化检测、获取并整理 Figma Desktop 客户端的各历史版本与最新版本的下载链接。

## 运行环境与包管理

- **运行环境**: [Bun](https://bun.sh/)
- **包管理工具**: `bun`（请勿直接使用 npm/yarn 进行依赖操作）
- **终端样式**: 使用 `chalk` 输出多彩的命令行日志

## 常用开发命令

| 命令 | 说明 |
| :--- | :--- |
| `bun run test` | 运行 Vitest 单元测试 |
| `bun run scan` | 自动获取线上最新版本并扫描检测未收录的客户端版本 |
| `bun run merge` | 合并 `versions-last.json` 扫描结果到主数据文件 `versions.json` |
| `bun run doc` | 根据 `versions.json` 生成 `readme.md` 与 `latest.json` |
| `bun run genUrls` | 提取所有版本的直接下载链接生成 `downloadUrls.txt` |
| `bun run build` | 一键执行全流程构建（scan -> merge -> doc -> genUrls -> build:web） |
| `bun run download` | 下载全平台最新客户端到本地 `dist` 目录 |

## 目录结构说明

```text
├── src/
│   ├── lib/
│   │   ├── version.js    # 版本号解析、线上版本获取、本地版本读取等工具函数
│   │   └── scanner.js    # 并发扫描引擎、URL 探测、chalk 多彩输出
│   ├── test/             # 单元测试（使用 Vitest 全局模式）
│   │   ├── version.test.js
│   │   └── scanner.test.js
│   ├── scan.js           # 扫描入口：自动从 version.txt 与本地对比并扫描
│   ├── merge.js          # 合并扫描结果到主版本库
│   ├── genReadme.js      # 生成 README.md 与 latest.json
│   ├── genUrls.js        # 生成下载 URL 清单
│   └── downloadLatest.js # 下载最新客户端
├── versions.json         # 所有收录的历史版本完整数据
├── versions-last.json    # 最近一次 scan 扫描出的版本数据
├── latest.json           # 当前各平台最新版本信息
└── vitest.config.js      # Vitest 配置文件 (globals: true)
```

## 代码规范与约定

1. **中文代码注释**：所有函数与复杂逻辑必须包含详细的中文注释和 JSDoc 说明。
2. **单元测试**：
   - 采用 `vitest` 全局模式（`test`、`expect` 等无需单独 import）。
   - 单元测试描述统一使用中文。
   - 测试文件放置在对应代码附近的 `src/test/*.test.js`。
3. **终端色彩**：采用 `chalk` 提供富有辨识度的状态标识（如 💚 成功、🖤 跳过、🚀 进度）。
