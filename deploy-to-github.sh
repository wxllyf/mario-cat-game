#!/bin/bash

echo "🎮 马里奥猫咪音游 - GitHub Pages 部署脚本"
echo "=========================================="
echo ""

# 检查是否在git仓库中
if [ ! -d ".git" ]; then
    echo "📦 初始化 Git 仓库..."
    git init
    git add .
    git commit -m "Initial commit: Mario Cat Rhythm Game"
    echo ""
    echo "✅ Git 仓库初始化完成"
    echo ""
    echo "📝 接下来请按照以下步骤操作："
    echo ""
    echo "1. 访问 https://github.com/new"
    echo "2. 创建一个新仓库，比如命名为: mario-cat-game"
    echo "3. 不要勾选 'Initialize with README'"
    echo "4. 点击 'Create repository'"
    echo ""
    echo "5. 复制仓库的 URL（类似：https://github.com/你的用户名/mario-cat-game.git）"
    echo ""
    read -p "请粘贴你的仓库 URL: " REPO_URL
    echo ""

    git branch -M main
    git remote add origin "$REPO_URL"
    git push -u origin main

    echo ""
    echo "✅ 代码已推送到 GitHub"
    echo ""
else
    echo "✅ 已在 Git 仓库中"
    echo ""

    # 检查是否有远程仓库
    if ! git remote get-url origin &> /dev/null; then
        echo "⚠️  未找到远程仓库"
        echo ""
        read -p "请输入你的 GitHub 仓库 URL: " REPO_URL
        git remote add origin "$REPO_URL"
    fi

    echo "📤 推送最新更改到 GitHub..."
    git add .
    git commit -m "Update game files"
    git push origin main
    echo ""
fi

echo "🌐 启用 GitHub Pages..."
echo ""
echo "请按照以下步骤启用 GitHub Pages："
echo ""
echo "1. 访问你的仓库页面"
echo "2. 点击 'Settings' (设置)"
echo "3. 在左侧菜单找到 'Pages'"
echo "4. 在 'Source' 下选择 'main' 分支"
echo "5. 点击 'Save'"
echo ""
echo "⏳ 等待约1-2分钟后，你的游戏将在以下地址可用："
echo "   https://你的用户名.github.io/mario-cat-game/"
echo ""
echo "🎉 完成！朋友们可以通过这个链接玩游戏了！"
echo ""
