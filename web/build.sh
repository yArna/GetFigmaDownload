#!/bin/bash

# 构建生产版本
echo "🚀 构建 Figma 分析器..."

# 确保在正确的目录
cd "$(dirname "$0")"

# 创建构建目录
mkdir -p dist

# 复制 HTML 文件并优化
echo "📄 处理 HTML 文件..."
cp index.html dist/
cp download.html dist/

# 复制 JavaScript 文件
echo "📁 复制资源文件..."
cp -r src dist/

# 复制版本数据文件（如果存在）
if [ -f "versions.json" ]; then
    cp versions.json dist/
fi

# 构建 CSS
echo "🎨 构建 CSS..."
npx tailwindcss -i src/styles/globals.css -o dist/styles.css --minify

# 更新 HTML 中的 CSS 引用
sed -i '' 's|<link rel="stylesheet" href="src/styles/globals.css">|<link rel="stylesheet" href="styles.css">|g' dist/index.html
sed -i '' 's|<link rel="stylesheet" href="src/styles/globals.css">|<link rel="stylesheet" href="styles.css">|g' dist/download.html
sed -i '' 's|<script src="https://cdn.tailwindcss.com"></script>||g' dist/index.html
sed -i '' 's|<script src="https://cdn.tailwindcss.com"></script>||g' dist/download.html

echo "✅ 构建完成！文件保存在 dist/ 目录中"
echo "🌐 可以使用任何静态文件服务器提供 dist/ 目录的内容"