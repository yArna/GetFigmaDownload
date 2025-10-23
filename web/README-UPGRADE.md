# Figma 版本更新分析器 - 现代化界面

这是一个基于 shadcn/ui 和 Tailwind CSS 重新设计的 Figma 版本更新分析工具，提供了现代化、响应式的用户界面。

## 🎨 界面特色

- **现代化设计**: 使用 shadcn/ui 设计系统，提供一致性和专业的视觉体验
- **响应式布局**: 完美适配桌面和移动设备
- **优雅的组件**: 卡片式布局、图标设计、渐变色彩
- **流畅动画**: 加载动画和交互反馈
- **无障碍支持**: 遵循 Web 无障碍标准

## 🚀 快速开始

### 开发环境

1. 安装依赖：
```bash
cd web
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中打开 `http://localhost:3000`

### 生产构建

1. 构建项目：
```bash
npm run build
```

2. 预览构建结果：
```bash
npm run preview
```

构建的文件将保存在 `dist/` 目录中，可以部署到任何静态文件服务器。

## 📁 项目结构

```
web/
├── index.html              # 主 HTML 文件
├── src/
│   ├── analyzer.js         # 核心分析逻辑
│   ├── styles/
│   │   └── globals.css     # 全局样式 (Tailwind)
│   ├── components/         # UI 组件 (预留)
│   └── lib/
│       └── utils.js        # 工具函数
├── package.json            # 依赖配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── build.sh               # 构建脚本
└── dist/                  # 构建输出目录
```

## 🛠 技术栈

- **UI 框架**: shadcn/ui 设计系统
- **样式**: Tailwind CSS
- **图表**: Chart.js
- **构建工具**: 自定义构建脚本
- **开发服务器**: Python HTTP Server

## 📊 功能特性

### 数据可视化
- 统计卡片显示关键指标
- 交互式图表展示版本发布趋势
- 月度发布频率分析
- 更新间隔分布
- 年度发布趋势

### 交互功能
- 平台筛选 (Windows, macOS, macOS ARM)
- 年份筛选
- 响应式设计
- 数据洞察自动生成

### 用户体验
- 加载状态显示
- 错误处理
- 平滑动画效果
- 现代化图标

## 🎯 设计系统

### 颜色主题
- 主色调: 蓝色到紫色渐变
- 背景: 浅灰色 (#f5f5f7)
- 卡片: 白色背景，轻微阴影
- 文字: 深灰色层次

### 组件规范
- 圆角: 12px (大卡片), 8px (小组件)
- 间距: 基于 Tailwind 的间距系统
- 字体: 系统字体栈，优先使用 SF Pro
- 阴影: 轻微的卡片阴影效果

## 🔧 自定义配置

### Tailwind 配置
在 `tailwind.config.js` 中可以自定义：
- 主题颜色
- 间距系统
- 响应式断点
- 自定义组件样式

### 图表配置
在 `src/analyzer.js` 中可以调整：
- 图表颜色主题
- 数据展示格式
- 交互行为
- 动画效果

## 📱 响应式设计

界面针对不同设备进行了优化：
- **桌面**: 多列网格布局，充分利用屏幕空间
- **平板**: 自适应列数，保持良好的比例
- **手机**: 单列布局，优化触摸交互

## 🚀 部署指南

### 静态文件部署
构建后的 `dist/` 目录可以直接部署到：
- Vercel
- Netlify
- GitHub Pages
- 任何静态文件服务器

### 自定义域名
如果需要自定义域名，只需要：
1. 将 `dist/` 目录内容上传到服务器
2. 配置服务器指向 `index.html`
3. 确保 `versions.json` 文件可以正常访问

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [shadcn/ui](https://ui.shadcn.com/) - 提供了优秀的设计系统
- [Tailwind CSS](https://tailwindcss.com/) - 强大的 CSS 框架
- [Chart.js](https://www.chartjs.org/) - 数据可视化库