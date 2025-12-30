# 🚀 GitHub Pages 部署指南

## 方法一：使用 GitHub Desktop（最简单，推荐新手）

### 1. 下载安装
访问：https://desktop.github.com/
下载并安装 GitHub Desktop

### 2. 登录 GitHub
打开 GitHub Desktop，点击 "Sign in to GitHub.com"
用浏览器登录（不需要在命令行输入密码）

### 3. 创建仓库
1. 点击 "Create a New Repository on your hard drive"
2. Name: `mario-cat-game`
3. Local Path: `/Users/wangxinlun/Documents`
4. 点击 "Create Repository"

### 4. 复制文件
把游戏文件（index.html, js/, style.css 等）全部复制到：
`/Users/wangxinlun/Documents/mario-cat-game/`

### 5. 提交并发布
1. 在 GitHub Desktop 中会看到所有文件
2. 左下角输入：Initial commit: Mario Cat Game
3. 点击 "Commit to main"
4. 点击 "Publish repository"
5. 取消勾选 "Keep this code private"
6. 点击 "Publish Repository"

### 6. 启用 GitHub Pages
1. 访问：https://github.com/你的用户名/mario-cat-game
2. 点击 Settings → Pages
3. Source 选择 "main"
4. 点击 Save

✅ 完成！你的游戏地址：
`https://你的用户名.github.io/mario-cat-game/`

---

## 方法二：直接在 GitHub 网页上传（最快）

### 1. 创建仓库
访问：https://github.com/new
- Repository name: `mario-cat-game`
- Public
- 不勾选任何选项
- 点击 "Create repository"

### 2. 上传文件
1. 点击 "uploading an existing file"
2. 把所有游戏文件拖进去（index.html, js文件夹, css等）
3. 底部输入：Initial commit
4. 点击 "Commit changes"

### 3. 启用 GitHub Pages
1. 点击 Settings → Pages
2. Source 选择 "main"
3. 点击 Save

✅ 完成！

---

## 🎮 游戏地址

部署成功后，你的游戏可以通过以下地址访问：

```
https://你的GitHub用户名.github.io/mario-cat-game/
```

分享这个链接给朋友，他们就能玩了！

---

## ⚠️ 安全提示

- ❌ 永远不要分享你的 GitHub 密码
- ✅ 使用 GitHub Desktop 或网页上传（自动处理认证）
- ✅ 如果用命令行，使用 Personal Access Token 代替密码
