# 🔧 Git 命令行部署教程

## 准备工作：生成 Personal Access Token

⚠️ **GitHub 已经禁止使用密码进行命令行操作（2021年8月起）**

### 1. 生成 Token
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置：
   - Note: `Mario Cat Game`
   - Expiration: `No expiration` （推荐）或 `90 days`
   - 勾选权限：**只勾选 `repo`**
4. 点击 "Generate token"
5. **立即复制 token！** 格式类似：`ghp_1234567890abcdefghijklmnopqrstuvwxyz`
6. **保存到安全的地方**（比如笔记本）

---

## 命令行操作步骤

### 第1步：初始化 Git 仓库
```bash
cd /Users/wangxinlun/Documents/mario-cat-game
git init
git add .
git commit -m "Initial commit: Mario Cat Rhythm Game"
```

### 第2步：在 GitHub 创建远程仓库
1. 访问：https://github.com/new
2. Repository name: `mario-cat-game`
3. 选择 **Public**
4. **不要**勾选任何初始化选项
5. 点击 "Create repository"

### 第3步：连接并推送
```bash
# 设置远程仓库（替换成你的用户名）
git remote add origin https://github.com/你的用户名/mario-cat-game.git

# 设置主分支名称
git branch -M main

# 推送代码
git push -u origin main
```

**⚠️ 这时会要求输入密码，请输入你刚才生成的 Token（不是GitHub密码）**

```
Username: 你的GitHub用户名
Password: ghp_你的token（粘贴刚才复制的token）
```

### 第4步：启用 GitHub Pages
1. 访问：https://github.com/你的用户名/mario-cat-game
2. 点击 **Settings**
3. 左侧菜单找到 **Pages**
4. Source 选择 **main** 分支
5. 点击 **Save**

### 第5步：访问游戏
等待 1-2 分钟后，访问：
```
https://你的用户名.github.io/mario-cat-game/
```

---

## 🔄 后续更新代码

每次修改代码后，运行以下命令：

```bash
cd /Users/wangxinlun/Documents/mario-cat-game
git add .
git commit -m "更新说明"
git push
```

第一次push后，后续不需要再输入token（会被缓存）。

---

## 💡 常用 Git 命令

```bash
# 查看状态
git status

# 查看提交历史
git log

# 查看远程仓库
git remote -v

# 撤销修改
git checkout -- 文件名

# 查看分支
git branch
```

---

## ⚠️ 注意事项

1. **Token 不是密码**：Token 比密码更安全，可以随时撤销
2. **Token 保存**：第一次输入后会被缓存，不用每次都输
3. **Token 丢失**：如果忘记了，重新生成一个即可
4. **不要分享**：Token 和密码一样重要，不要分享给任何人

---

## 📖 参考资料

- GitHub Token 文档：https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- Git 官方教程：https://git-scm.com/book/zh/v2
